
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { invoices, invoiceItems, clients, companies } from "../../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import { create } from 'xmlbuilder2';
import QRCode from 'qrcode';
import { adminStorage } from "@/lib/firebase/admin";
import { Buffer } from 'buffer';

const conceptSchema = z.object({
  productId: z.number(),
  satKey: z.string(),
  unitKey: z.string(),
  description: z.string(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0."),
  unitPrice: z.coerce.number(),
  discount: z.coerce.number().optional().default(0),
  objetoImpuesto: z.string().min(1, "Selecciona el objeto de impuesto."),
  amount: z.coerce.number(),
});

const invoiceSchema = z.object({
  clientId: z.coerce.number().min(1, "Debes seleccionar un cliente."),
  serie: z.string().default("A"),
  folio: z.coerce.number().default(1025),
  tipoDocumento: z.string().default("I"),
  exportacion: z.string().default("01"),
  usoCfdi: z.string().min(1, "Debes seleccionar un uso de CFDI."),
  formaPago: z.string().min(1, "Debes seleccionar una forma de pago."),
  metodoPago: z.string().default("PUE"),
  moneda: z.string().default("MXN"),
  condicionesPago: z.string().optional(),
  concepts: z.array(conceptSchema).min(1, "La factura debe tener al menos un concepto."),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const getInvoices = async (userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db
      .select({
        id: invoices.id,
        clientName: clients.name,
        clientRfc: clients.rfc,
        clientEmail: clients.email,
        status: invoices.status,
        createdAt: invoices.createdAt,
        total: invoices.total,
        pdfUrl: invoices.pdfUrl,
        xmlUrl: invoices.xmlUrl,
        serie: invoices.serie,
        folio: invoices.folio,
        metodoPago: invoices.metodoPago,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));

    return { success: true, data };
  } catch (error) {
    console.error("Database Error (getInvoices):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al obtener las facturas. Verifique la consola del servidor para más detalles: ${errorMessage}` };
  }
};

export const getPendingInvoices = async (userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db
      .select({
        id: invoices.id,
        clientName: clients.name,
        clientRfc: clients.rfc,
        clientEmail: clients.email,
        status: invoices.status,
        createdAt: invoices.createdAt,
        total: invoices.total,
        pdfUrl: invoices.pdfUrl,
        xmlUrl: invoices.xmlUrl,
        serie: invoices.serie,
        folio: invoices.folio,
        metodoPago: invoices.metodoPago,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.metodoPago, 'PPD'),
        eq(invoices.status, 'stamped')
      ))
      .orderBy(desc(invoices.createdAt));

    return { success: true, data };
  } catch (error) {
    console.error("Database Error (getPendingInvoices):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al obtener las facturas pendientes. Verifique la consola del servidor para más detalles: ${errorMessage}` };
  }
};

export const saveInvoice = async (formData: InvoiceFormValues, userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    
    const validatedData = invoiceSchema.parse(formData);

    // Recalculate totals on the server to ensure data integrity
    const subtotal = validatedData.concepts.reduce((acc, c) => acc + (c.quantity * c.unitPrice), 0);
    const totalDiscounts = validatedData.concepts.reduce((acc, c) => acc + (c.discount || 0), 0);
    const baseImponible = subtotal - totalDiscounts;
    const iva = baseImponible * 0.16;
    const totalRetenidos = 0; // Placeholder for future implementation
    const total = baseImponible + iva - totalRetenidos;


    // 1. Create Invoice record in DB
    const [newInvoice] = await db.insert(invoices).values({
      userId,
      clientId: validatedData.clientId,
      serie: validatedData.serie,
      folio: validatedData.folio,
      usoCfdi: validatedData.usoCfdi,
      formaPago: validatedData.formaPago,
      metodoPago: validatedData.metodoPago,
      condicionesPago: validatedData.condicionesPago ?? null,
      subtotal: subtotal.toString(),
      discounts: totalDiscounts.toString(),
      iva: iva.toString(),
      retenciones: totalRetenidos.toString(),
      total: total.toString(),
      status: 'draft',
    }).returning({ id: invoices.id, serie: invoices.serie, folio: invoices.folio, clientId: invoices.clientId });

    if (!newInvoice) {
        throw new Error("No se pudo crear la factura.");
    }
    
    const conceptsToInsert = validatedData.concepts.map(concept => ({
      invoiceId: newInvoice.id,
      description: concept.description,
      satKey: concept.satKey,
      unitKey: concept.unitKey,
      unitPrice: concept.unitPrice.toString(),
      quantity: concept.quantity,
      discount: (concept.discount || 0).toString(),
      amount: ((concept.quantity * concept.unitPrice) - (concept.discount || 0)).toString(),
    }));

    await db.insert(invoiceItems).values(conceptsToInsert);

    // 2. Generate PDF and XML and upload to Storage
    const invoiceData = await getInvoiceForDownload(newInvoice.id, userId);
    if (!invoiceData) {
      throw new Error("No se pudieron obtener los datos de la factura recién creada.");
    }

    const xmlString = await _generateXmlString(invoiceData);
    const pdfBytes = await _generatePdfBuffer(invoiceData);

    let pdfUrl = '';
    let xmlUrl = '';

    if (adminStorage) {
      const bucket = adminStorage.bucket();
      const basePath = `invoices/${userId}/${newInvoice.clientId}`;
      const pdfFileName = `${newInvoice.serie}-${newInvoice.folio}.pdf`;
      const xmlFileName = `${newInvoice.serie}-${newInvoice.folio}.xml`;
      const pdfFilePath = `${basePath}/${pdfFileName}`;
      const xmlFilePath = `${basePath}/${xmlFileName}`;

      const pdfFile = bucket.file(pdfFilePath);
      await pdfFile.save(Buffer.from(pdfBytes), {
        metadata: { contentType: 'application/pdf' },
      });
      await pdfFile.makePublic();
      pdfUrl = pdfFile.publicUrl();

      const xmlFile = bucket.file(xmlFilePath);
      await xmlFile.save(xmlString, {
        metadata: { contentType: 'application/xml' },
      });
      await xmlFile.makePublic();
      xmlUrl = xmlFile.publicUrl();

      // 3. Update invoice record with storage URLs
      await db.update(invoices).set({ pdfUrl, xmlUrl }).where(eq(invoices.id, newInvoice.id));
    } else {
      console.warn("Firebase Admin Storage not available. Skipping file upload.");
    }

    revalidatePath("/dashboard/invoices");
    
    return { success: true, data: { ...newInvoice, pdfUrl, xmlUrl } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Datos del formulario no válidos.", errors: error.flatten().fieldErrors };
    }
    console.error("Database Error (saveInvoice):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al guardar la factura.";
    return { success: false, message: `${errorMessage}` };
  }
};


async function getInvoiceForDownload(invoiceId: number, userId: string) {
    if (!db) return null;

    const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)));
    if (!invoice) return null;

    const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId));
    if (!client) return null;

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));

    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    if (!company) return null;

    return { invoice, client, items, company };
}

async function _generateXmlString(data: NonNullable<Awaited<ReturnType<typeof getInvoiceForDownload>>>) {
    const { invoice, client, items, company } = data;
    const date = new Date(invoice.createdAt!).toISOString().slice(0, -5);

    const concepts = items.map(item => ({
        'cfdi:Concepto': {
            '@Importe': parseFloat(item.amount).toFixed(2),
            '@ValorUnitario': parseFloat(item.unitPrice).toFixed(2),
            '@Descripcion': item.description,
            '@Unidad': item.unitKey,
            '@ClaveUnidad': item.unitKey,
            '@Cantidad': item.quantity,
            '@ClaveProdServ': item.satKey,
            '@ObjetoImp': '02',
            'cfdi:Impuestos': {
                'cfdi:Traslados': {
                    'cfdi:Traslado': {
                        '@Base': parseFloat(item.amount).toFixed(2),
                        '@Impuesto': '002',
                        '@TipoFactor': 'Tasa',
                        '@TasaOCuota': '0.160000',
                        '@Importe': (parseFloat(item.amount) * 0.16).toFixed(2),
                    }
                }
            }
        }
    }));

    const xmlObject = {
        'cfdi:Comprobante': {
            '@xmlns:cfdi': 'http://www.sat.gob.mx/cfd/4',
            '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@xsi:schemaLocation': 'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd',
            '@Version': '4.0',
            '@Serie': invoice.serie,
            '@Folio': invoice.folio,
            '@Fecha': date,
            '@Sello': 'PLACEHOLDER_SELLO',
            '@FormaPago': invoice.formaPago,
            '@NoCertificado': 'PLACEHOLDER_NOCERTIFICADO',
            '@Certificado': 'PLACEHOLDER_CERTIFICADO',
            '@SubTotal': parseFloat(invoice.subtotal).toFixed(2),
            '@Moneda': 'MXN',
            '@Total': parseFloat(invoice.total).toFixed(2),
            '@TipoDeComprobante': 'I',
            '@Exportacion': '01',
            '@MetodoPago': invoice.metodoPago,
            '@LugarExpedicion': company.address.split(',').pop()?.trim().substring(0, 5) || '00000',
            'cfdi:Emisor': {
                '@Rfc': company.rfc,
                '@Nombre': company.companyName,
                '@RegimenFiscal': company.taxRegime,
            },
            'cfdi:Receptor': {
                '@Rfc': client.rfc,
                '@Nombre': client.name,
                '@DomicilioFiscalReceptor': client.zip,
                '@RegimenFiscalReceptor': client.taxRegime,
                '@UsoCFDI': invoice.usoCfdi,
            },
            'cfdi:Conceptos': concepts,
            'cfdi:Impuestos': {
                '@TotalImpuestosTrasladados': parseFloat(invoice.iva).toFixed(2),
                'cfdi:Traslados': {
                    'cfdi:Traslado': {
                        '@Base': parseFloat(invoice.subtotal).toFixed(2),
                        '@Impuesto': '002',
                        '@TipoFactor': 'Tasa',
                        '@TasaOCuota': '0.160000',
                        '@Importe': parseFloat(invoice.iva).toFixed(2),
                    }
                }
            }
        }
    };

    const doc = create({ version: '1.0', encoding: 'UTF-8' }, xmlObject);
    return doc.end({ prettyPrint: true });
}

async function _generatePdfBuffer(data: NonNullable<Awaited<ReturnType<typeof getInvoiceForDownload>>>) {
    const { invoice, client, items, company } = data;
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const lightGray = rgb(0.9, 0.9, 0.9);
    const darkGray = rgb(0.4, 0.4, 0.4);
    const textGray = rgb(0.3, 0.3, 0.3);

    const margin = 40;
    let y = height - margin;

    const drawText = (text: string, x: number, yPos: number, fontType: PDFFont = font, size = 9, color = textGray) => {
        page.drawText(text, { x, y: yPos, font: fontType, size, color, lineHeight: size + 2 });
    };

    const drawTextBlock = (text: string, x: number, yPos: number, maxWidth: number, fontType: PDFFont = font, size = 9, color = textGray) => {
        const words = text.split(' ');
        let line = '';
        let currentY = yPos;
        for(const word of words) {
            const testLine = line + word + ' ';
            const textWidth = fontType.widthOfTextAtSize(testLine, size);
            if (textWidth > maxWidth) {
                drawText(line, x, currentY, fontType, size, color);
                line = word + ' ';
                currentY -= size + 2;
            } else {
                line = testLine;
            }
        }
        drawText(line, x, currentY, fontType, size, color);
        return currentY - (size + 2);
    };

    // --- Header ---
    drawText('Factura Electrónica', margin, y, boldFont, 18, rgb(0,0,0));
    y -= 30;

    // --- Company Info & CFDI Data ---
    const columnWidth = (width - margin * 3) / 2;
    const rightColumnX = margin + columnWidth + margin;
    
    const logoPath = 'M50,5C25.2,5,5,25.2,5,50s20.2,45,45,45s45-20.2,45-45S74.8,5,50,5z M50,85c-19.3,0-35-15.7-35-35S30.7,15,50,15 s35,15.7,35,35S69.3,85,50,85z M50,25c-13.8,0-25,11.2-25,25s11.2,25,25,25s25-11.2,25-25S63.8,25,50,25z M50,65c-8.3,0-15-6.7-15-15s6.7-15,15-15 s15,6.7,15,15S58.3,65,50,65z';
    page.drawSvg(logoPath, { x: margin, y: y - 25, color: rgb(0.36, 0.45, 0.93), scale: 0.5 });
    
    let leftY = y - 40;
    drawText(company.companyName, margin, leftY, boldFont, 10);
    leftY -= 12;
    drawText(company.rfc, margin, leftY);
    leftY -= 12;
    leftY = drawTextBlock(company.address, margin, leftY, columnWidth);
    
    page.drawRectangle({x: rightColumnX - 10, y: y - 110, width: columnWidth + 20, height: 130, borderColor: lightGray, borderWidth: 1});
    drawText(`Factura #${invoice.serie}-${invoice.folio}`, rightColumnX, y, boldFont, 12, rgb(0,0,0));
    let rightY = y - 20;
    drawText('Folio Fiscal:', rightColumnX, rightY, boldFont);
    drawText('PLACEHOLDER-UUID-FOLIO-FISCAL', rightColumnX + 70, rightY);
    rightY -= 15;
    drawText('Fecha Expedición:', rightColumnX, rightY, boldFont);
    drawText(new Date(invoice.createdAt!).toLocaleString('es-MX'), rightColumnX + 70, rightY);
    rightY -= 15;
    drawText('Fecha Timbrado:', rightColumnX, rightY, boldFont);
    drawText('PLACEHOLDER_FECHA_TIMBRADO', rightColumnX + 70, rightY);
    rightY -= 15;
    drawText('CSD del SAT:', rightColumnX, rightY, boldFont);
    drawText('PLACEHOLDER_CSD_SAT', rightColumnX + 70, rightY);
    rightY -= 15;
    drawText('CSD del Emisor:', rightColumnX, rightY, boldFont);
    drawText('PLACEHOLDER_CSD_EMISOR', rightColumnX + 70, rightY);
    rightY -= 15;
    drawText('Tipo de Comprobante:', rightColumnX, rightY, boldFont);
    drawText('I - Ingreso', rightColumnX + 100, rightY);

    y = Math.min(leftY, rightY) - 20;

    // --- Client Info ---
    page.drawRectangle({x: margin, y: y - 5, width: width - margin*2, height: 20, color: lightGray});
    drawText('Empresa', margin + 5, y, boldFont, 10, rgb(0,0,0));
    y -= 25;
    drawText('Cliente:', margin, y, boldFont);
    drawText(client.name, margin + 100, y);
    y -= 15;
    drawText('R.F.C:', margin, y, boldFont);
    drawText(client.rfc, margin + 100, y);
    y -= 15;
    drawText('Dirección Fiscal:', margin, y, boldFont);
    drawText(client.zip, margin + 100, y);
    y -= 15;
    drawText('Uso CFDI:', margin, y, boldFont);
    drawText(invoice.usoCfdi, margin + 100, y);
    y -= 15;
    drawText('Régimen Fiscal:', margin, y, boldFont);
    drawText(client.taxRegime, margin + 100, y);
    y -= 20;

    // --- Items Table ---
    page.drawRectangle({x: margin, y: y-5, width: width - margin*2, height: 20, color: lightGray});
    const tableHeadersX = [margin + 5, margin + 60, margin + 120, margin + 350, margin + 420, margin + 490];
    const tableHeaders = ['Cantidad', 'Clave Unidad', 'Descripción', 'Clave Producto', 'Precio Unitario', 'Importe Neto'];
    tableHeaders.forEach((header, i) => drawText(header, tableHeadersX[i], y, boldFont, 10, rgb(0,0,0)));
    y -= 20;

    items.forEach(item => {
        if (y < margin + 150) { // Check for page break
            page = pdfDoc.addPage();
            y = height - margin;
        }
        const itemY = y;
        drawText(item.quantity.toString(), tableHeadersX[0], itemY);
        drawText(item.unitKey, tableHeadersX[1], itemY);
        const descY = drawTextBlock(item.description, tableHeadersX[2], itemY, 220);
        drawText(item.satKey, tableHeadersX[3], itemY);
        drawText(`$${parseFloat(item.unitPrice).toFixed(2)}`, tableHeadersX[4], itemY);
        drawText(`$${parseFloat(item.amount).toFixed(2)}`, tableHeadersX[5], itemY);
        y = descY - 5;
        page.drawLine({start: {x: margin, y: y}, end: {x: width - margin, y: y}, thickness: 0.5, color: lightGray});
        y -= 10;
    });
    
    y -= 10;

    // --- Totals Section ---
    const totalX = width - margin - 200;
    const totalAmountX = width - margin - 80;
    drawText('Importe con Letra:', margin, y, boldFont);
    drawText('Subtotal:', totalX, y, boldFont);
    drawText(`$${parseFloat(invoice.subtotal).toFixed(2)}`, totalAmountX, y, font, 9, rgb(0,0,0));
    y -= 15;
    drawText('(PLACEHOLDER IMPORTE CON LETRA)', margin, y);
    drawText('Descuento:', totalX, y, boldFont);
    drawText('$0.00', totalAmountX, y, font, 9, rgb(0,0,0));
    y -= 15;
    drawText('IVA 16.0%:', totalX, y, boldFont);
    drawText(`$${parseFloat(invoice.iva).toFixed(2)}`, totalAmountX, y, font, 9, rgb(0,0,0));
    y -= 5;
    page.drawLine({start: {x: totalX - 5, y: y}, end: {x: width - margin, y: y}, thickness: 1, color: rgb(0,0,0)});
    y -= 15;
    drawText('Total:', totalX, y, boldFont, 12, rgb(0,0,0));
    drawText(`$${parseFloat(invoice.total).toFixed(2)}`, totalAmountX, y, boldFont, 12, rgb(0,0,0));
    y -= 30;

    // --- Payment Info ---
    drawText('Forma de Pago:', margin, y, boldFont);
    drawText(invoice.formaPago, margin + 80, y);
    y -= 15;
    drawText('Método de Pago:', margin, y, boldFont);
    drawText(invoice.metodoPago, margin + 80, y);
    y -= 15;
    drawText('Moneda:', margin, y, boldFont);
    drawText('MXN', margin + 80, y);
    y -= 30;

    // --- QR & Seals ---
    const qrData = `||1.1|PLACEHOLDER-UUID|${new Date(invoice.createdAt!).toISOString()}|PLACEHOLDER_SELLO|PLACEHOLDER_NOCERTIFICADO||`;
    const qrCodeImage = await pdfDoc.embedPng(await QRCode.toDataURL(qrData));
    page.drawImage(qrCodeImage, { x: margin, y: y - 110, width: 120, height: 120 });
    
    const sealX = margin + 140;
    const sealWidth = width - margin - sealX;
    let sealY = y;
    drawText('SELLO DIGITAL DEL CFDI', sealX, sealY, boldFont);
    sealY -= 12;
    sealY = drawTextBlock('PLACEHOLDER_SELLO_DIGITAL_CFDI_MUY_LARGO_PARA_PROBAR_EL_TEXT_WRAP_QUE_DEBE_SER_MUY_EFICIENTE_Y_FUNCIONAL_EN_TODOS_LOS_CASOS_DE_USO_IMAGINABLES', sealX, sealY, sealWidth, font, 7);
    sealY -= 10;
    drawText('SELLO DIGITAL DEL SAT', sealX, sealY, boldFont);
    sealY -= 12;
    sealY = drawTextBlock('PLACEHOLDER_SELLO_DIGITAL_SAT_TAMBIEN_MUY_LARGO_PARA_PROBAR_EL_TEXT_WRAP_QUE_DEBE_SER_MUY_EFICIENTE_Y_FUNCIONAL_EN_TODOS_LOS_CASOS_DE_USO_IMAGINABLES', sealX, sealY, sealWidth, font, 7);
    sealY -= 10;
    drawText('CADENA ORIGINAL DEL COMPLEMENTO DE CERTIFICACIÓN DIGITAL DEL SAT', sealX, sealY, boldFont);
    sealY -= 12;
    sealY = drawTextBlock(qrData, sealX, sealY, sealWidth, font, 7);
    
    // --- Footer ---
    page.drawText('ESTE DOCUMENTO ES UNA REPRESENTACIÓN IMPRESA DE UN CFDI', {
        x: width / 2,
        y: margin / 2,
        font: boldFont,
        size: 8,
        color: darkGray,
        xAlign: 'center',
        yAlign: 'center',
    });

    return await pdfDoc.save();
}


export const generateInvoiceXml = async (invoiceId: number, userId: string) => {
    try {
        const data = await getInvoiceForDownload(invoiceId, userId);
        if (!data) {
            return { success: false, message: "No se encontró la factura." };
        }
        const xml = await _generateXmlString(data);
        return { success: true, xml };
    } catch (error) {
        console.error("Error generating XML:", error);
        const message = error instanceof Error ? error.message : "Error desconocido al generar el XML.";
        return { success: false, message: `Error al generar XML: ${message}` };
    }
};

export const generateInvoicePdf = async (invoiceId: number, userId: string) => {
    try {
        const data = await getInvoiceForDownload(invoiceId, userId);
        if (!data) {
            return { success: false, message: "No se encontró la factura." };
        }
        const pdfBytes = await _generatePdfBuffer(data);
        return { success: true, pdf: Buffer.from(pdfBytes).toString('base64') };
    } catch (error) {
        console.error("Error generating PDF:", error);
        const message = error instanceof Error ? error.message : "Error desconocido al generar el PDF.";
        return { success: false, message: `Error al generar PDF: ${message}` };
    }
};
