
"use server";

import db from "@/lib/db";
import { payments, clients } from "../../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
      
    return { success: true, data };
  } catch (error) {
    console.error("Database Error (getPayments):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al obtener los pagos. Verifique la consola del servidor para más detalles: ${errorMessage}` };
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
