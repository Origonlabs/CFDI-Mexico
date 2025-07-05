
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { invoices, invoiceItems, clients, companies } from "../../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { create } from 'xmlbuilder2';


const conceptSchema = z.object({
  productId: z.number(),
  satKey: z.string(),
  unitKey: z.string(),
  description: z.string(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0."),
  unitPrice: z.coerce.number(),
  amount: z.coerce.number(),
});

const invoiceSchema = z.object({
  clientId: z.coerce.number().min(1, "Debes seleccionar un cliente."),
  usoCfdi: z.string().min(1, "Debes seleccionar un uso de CFDI."),
  metodoPago: z.string().default("PUE"),
  serie: z.string().default("A"),
  folio: z.coerce.number().default(1025),
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
        status: invoices.status,
        createdAt: invoices.createdAt,
        total: invoices.total
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

export const saveInvoice = async (formData: InvoiceFormValues, userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    
    const validatedData = invoiceSchema.parse(formData);

    const subtotal = validatedData.concepts.reduce((acc, concept) => acc + concept.amount, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const [newInvoice] = await db.insert(invoices).values({
      userId,
      clientId: validatedData.clientId,
      serie: validatedData.serie,
      folio: validatedData.folio,
      usoCfdi: validatedData.usoCfdi,
      metodoPago: validatedData.metodoPago,
      condicionesPago: validatedData.condicionesPago ?? null,
      subtotal: subtotal.toString(),
      iva: iva.toString(),
      total: total.toString(),
      status: 'draft',
    }).returning({ id: invoices.id });

    if (!validatedData.concepts || validatedData.concepts.length === 0) {
      throw new Error("La factura debe tener al menos un concepto.");
    }
    
    const conceptsToInsert = validatedData.concepts.map(concept => ({
      invoiceId: newInvoice.id,
      description: concept.description,
      satKey: concept.satKey,
      unitKey: concept.unitKey,
      unitPrice: concept.unitPrice.toString(),
      quantity: concept.quantity,
      amount: concept.amount.toString(),
    }));

    await db.insert(invoiceItems).values(conceptsToInsert);

    revalidatePath("/dashboard/invoices");
    
    return { success: true, data: newInvoice };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Datos del formulario no válidos.", errors: error.flatten().fieldErrors };
    }
    console.error("Database Error (saveInvoice):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al guardar la factura.";
    return { success: false, message: `Error al guardar: ${errorMessage}` };
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

export const generateInvoiceXml = async (invoiceId: number, userId: string) => {
    try {
        const data = await getInvoiceForDownload(invoiceId, userId);
        if (!data) {
            return { success: false, message: "No se encontró la factura." };
        }
        const { invoice, client, items, company } = data;

        const date = new Date(invoice.createdAt!).toISOString().slice(0, -5);

        const concepts = items.map(item => {
            return {
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
            };
        });

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
                '@FormaPago': '01',
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
                    '@RegimenFiscal': '601',
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
        const xml = doc.end({ prettyPrint: true });

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
        const { invoice, client, items, company } = data;

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const fontSize = 10;
        const margin = 50;
        let y = height - margin;

        const drawText = (text: string, x: number, yPos: number, fontType = font, size = fontSize) => {
            page.drawText(text, { x, y: yPos, font: fontType, size, color: rgb(0, 0, 0) });
        };
        
        drawText('Factura', margin, y, boldFont, 24);
        y -= 30;

        drawText('Emisor:', margin, y, boldFont, 12);
        y -= 15;
        drawText(company.companyName, margin, y, font, fontSize);
        y -= 15;
        drawText(`RFC: ${company.rfc}`, margin, y, font, fontSize);
        y -= 15;
        drawText(company.address, margin, y, font, fontSize);
        y -= 30;
        
        drawText('Receptor:', margin, y, boldFont, 12);
        y -= 15;
        drawText(client.name, margin, y, font, fontSize);
        y -= 15;
        drawText(`RFC: ${client.rfc}`, margin, y, font, fontSize);
        y -= 15;
        drawText(`Uso CFDI: ${invoice.usoCfdi}`, margin, y, font, fontSize);
        y -= 30;
        
        const detailsX = width - margin - 150;
        drawText('Folio:', detailsX, height - margin - 20, boldFont, 12);
        drawText(`${invoice.serie}-${invoice.folio}`, detailsX + 40, height - margin - 20, font, 12);
        drawText('Fecha:', detailsX, height - margin - 40, boldFont, 12);
        drawText(new Date(invoice.createdAt!).toLocaleDateString('es-MX'), detailsX + 40, height - margin - 40, font, 12);

        y -= 20;
        drawText('Descripción', margin, y, boldFont);
        drawText('Cant.', width / 2, y, boldFont);
        drawText('P. Unitario', width / 2 + 80, y, boldFont);
        drawText('Importe', width - margin - 50, y, boldFont);
        y -= 5;
        page.drawLine({
            start: { x: margin, y: y },
            end: { x: width - margin, y: y },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
        y -= 15;
        
        items.forEach(item => {
            drawText(item.description, margin, y, font, fontSize);
            drawText(item.quantity.toString(), width / 2, y, font, fontSize);
            drawText(`$${parseFloat(item.unitPrice).toFixed(2)}`, width / 2 + 80, y, font, fontSize);
            drawText(`$${parseFloat(item.amount).toFixed(2)}`, width - margin - 50, y, font, fontSize);
            y -= 20;
            if (y < margin + 100) {
                page = pdfDoc.addPage();
                y = height - margin;
            }
        });

        const totalX = width - margin - 150;
        y -= 10;
        page.drawLine({
            start: { x: totalX - 20, y: y },
            end: { x: width - margin, y: y },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
        });
        y -= 20;

        drawText('Subtotal:', totalX, y, boldFont);
        drawText(`$${parseFloat(invoice.subtotal).toFixed(2)}`, totalX + 80, y, font);
        y -= 20;

        drawText('IVA (16%):', totalX, y, boldFont);
        drawText(`$${parseFloat(invoice.iva).toFixed(2)}`, totalX + 80, y, font);
        y -= 20;

        drawText('Total:', totalX, y, boldFont, 12);
        drawText(`$${parseFloat(invoice.total).toFixed(2)}`, totalX + 80, y, font, 12);

        const pdfBytes = await pdfDoc.save();
        return { success: true, pdf: Buffer.from(pdfBytes).toString('base64') };

    } catch (error) {
        console.error("Error generating PDF:", error);
        const message = error instanceof Error ? error.message : "Error desconocido al generar el PDF.";
        return { success: false, message: `Error al generar PDF: ${message}` };
    }
};
