
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { invoices, invoiceItems, clients } from "../../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const conceptSchema = z.object({
  productId: z.number(),
  satKey: z.string(),
  description: z.string(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0."),
  unitPrice: z.coerce.number(),
  amount: z.coerce.number(),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Debes seleccionar un cliente."),
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
    return { success: false, message: "La URL de la base de datos no está configurada." };
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
    console.error(error);
    return { success: false, message: "Error al obtener las facturas." };
  }
};

export const saveInvoice = async (formData: InvoiceFormValues, userId: string) => {
  if (!db) {
    return { success: false, message: "La URL de la base de datos no está configurada." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    
    const validatedData = invoiceSchema.parse(formData);

    // Server-side calculation of totals
    const subtotal = validatedData.concepts.reduce((acc, concept) => acc + concept.amount, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const data = await db.transaction(async (tx) => {
      const [newInvoice] = await tx.insert(invoices).values({
        userId,
        clientId: parseInt(validatedData.clientId),
        serie: validatedData.serie,
        folio: validatedData.folio,
        usoCfdi: validatedData.usoCfdi,
        metodoPago: validatedData.metodoPago,
        condicionesPago: validatedData.condicionesPago,
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
        unitKey: "E48", // Using a default value as it's not in the form
        unitPrice: concept.unitPrice.toString(),
        quantity: concept.quantity,
        amount: concept.amount.toString(),
      }));

      await tx.insert(invoiceItems).values(conceptsToInsert);

      return newInvoice;
    });

    revalidatePath("/dashboard/invoices");
    
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Datos del formulario no válidos.", errors: error.flatten().fieldErrors };
    }
    console.error(error);
    return { success: false, message: "No se pudo guardar la factura." };
  }
};
