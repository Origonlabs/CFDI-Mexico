
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { payments, paymentDocuments, clients } from "../../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { paymentSchema, type PaymentFormValues } from "@/lib/schemas";

export const getPayments = async (userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db
      .select({
        id: payments.id,
        clientName: clients.name,
        clientRfc: clients.rfc,
        clientEmail: clients.email,
        status: payments.status,
        createdAt: payments.createdAt,
        total: payments.totalAmount,
        pdfUrl: payments.pdfUrl,
        xmlUrl: payments.xmlUrl,
        serie: payments.serie,
        folio: payments.folio,
        currency: payments.currency,
        paymentForm: payments.paymentForm,
        operationNumber: payments.operationNumber,
      })
      .from(payments)
      .leftJoin(clients, eq(payments.clientId, clients.id))
      .where(and(eq(payments.userId, userId), eq(clients.userId, userId)))
      .orderBy(desc(payments.createdAt));
      
    return { success: true, data };
  } catch (error) {
    console.error("Database Error (getPayments):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al obtener los pagos. Verifique la consola del servidor para más detalles: ${errorMessage}` };
  }
};

export const savePayment = async (formData: PaymentFormValues, userId: string) => {
    if (!db) {
        return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
    }
    try {
        if (!userId) {
            return { success: false, message: "Usuario no autenticado." };
        }

        const validatedData = paymentSchema.parse(formData);

        const { fechaPago, horaPago, ...restOfData } = validatedData;
        const [hours, minutes] = horaPago.split(':').map(Number);
        const paymentDateTime = new Date(fechaPago);
        paymentDateTime.setHours(hours, minutes);

        const [newPayment] = await db.insert(payments).values({
            userId,
            clientId: restOfData.clientId,
            serie: restOfData.serie,
            folio: restOfData.folio,
            paymentDate: paymentDateTime,
            paymentForm: restOfData.formaPago,
            currency: restOfData.moneda,
            totalAmount: restOfData.totalPago.toString(),
            operationNumber: restOfData.numeroOperacion,
            status: 'draft',
            relationType: restOfData.relationType,
            relatedCfdis: restOfData.relatedCfdis && restOfData.relatedCfdis.length > 0
                ? JSON.stringify(restOfData.relatedCfdis)
                : null,
        }).returning({ id: payments.id, serie: payments.serie, folio: payments.folio });

        if (!newPayment) {
            throw new Error("No se pudo crear el complemento de pago.");
        }

        const documentsToInsert = restOfData.relatedDocuments.map(doc => ({
            paymentId: newPayment.id,
            userId,
            invoiceId: doc.invoiceId,
            uuid: doc.uuid,
            serie: doc.serie,
            folio: doc.folio,
            currency: doc.moneda,
            exchangeRate: doc.tipoCambio.toString(),
            paymentMethod: doc.metodoPago,
            partialityNumber: doc.numParcialidad,
            previousBalance: doc.saldoAnterior.toString(),
            amountPaid: doc.importePagado.toString(),
            outstandingBalance: doc.saldoInsoluto.toString(),
        }));
        
        await db.insert(paymentDocuments).values(documentsToInsert);

        revalidatePath("/dashboard/payments");
        
        return { success: true, data: newPayment };
    } catch (error) {
        if (error instanceof z.ZodError) {
          return { success: false, message: "Datos del formulario no válidos.", errors: error.flatten().fieldErrors };
        }
        console.error("Database Error (savePayment):", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al guardar el pago.";
        return { success: false, message: `${errorMessage}` };
    }
};

export const getCanceledPayments = async (userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db
      .select({
        id: payments.id,
        clientName: clients.name,
        clientRfc: clients.rfc,
        clientEmail: clients.email,
        status: payments.status,
        createdAt: payments.createdAt,
        total: payments.totalAmount,
        pdfUrl: payments.pdfUrl,
        xmlUrl: payments.xmlUrl,
        serie: payments.serie,
        folio: payments.folio,
        currency: payments.currency,
        paymentForm: payments.paymentForm,
        operationNumber: payments.operationNumber,
      })
      .from(payments)
      .leftJoin(clients, eq(payments.clientId, clients.id))
      .where(and(
          eq(payments.userId, userId),
          eq(clients.userId, userId),
          eq(payments.status, 'canceled')
      ))
      .orderBy(desc(payments.createdAt));
      
    return { success: true, data };
  } catch (error) {
    console.error("Database Error (getCanceledPayments):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al obtener los pagos cancelados. Verifique la consola del servidor para más detalles: ${errorMessage}` };
  }
};

export const getDeletedPayments = async (userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    // For now, this will return no documents as there is no "deleted" state.
    // This matches the requested UI.
    const data: any[] = [];
    return { success: true, data };
  } catch (error) {
    console.error("Database Error (getDeletedPayments):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al obtener los pagos eliminados. Verifique la consola del servidor para más detalles: ${errorMessage}` };
  }
};
