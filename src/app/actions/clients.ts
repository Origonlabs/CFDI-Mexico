
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { clients } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { clientSchema, type ClientFormValues } from "@/lib/schemas";
import { getRateLimiter } from "@/lib/rate-limiter";

export const getClients = async (userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db.select().from(clients).where(eq(clients.userId, userId));
    return { success: true, data };
  } catch (error) {
    console.error("Database Error (getClients):", error);
    return { success: false, message: "Error al obtener los clientes. Verifique la consola del servidor para más detalles." };
  }
};

export const addClient = async (formData: ClientFormValues, userId: string) => {
  const ratelimit = getRateLimiter();
  const { success: rateLimitSuccess } = await ratelimit.limit(userId);
  if (!rateLimitSuccess) {
      return { success: false, message: "Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde." };
  }

  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    
    const validatedData = clientSchema.parse(formData);
    
    const data = await db.insert(clients).values({
      ...validatedData,
      email: validatedData.email || "", // Ensure email is not undefined
      userId,
    }).returning();

    revalidatePath("/dashboard/clients");
    
    return { success: true, data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Datos del formulario no válidos." };
    }
    console.error("Database Error (addClient):", error);
    return { success: false, message: "No se pudo guardar el cliente. Verifique la consola del servidor para más detalles." };
  }
};

export const updateClient = async (clientId: number, formData: ClientFormValues, userId: string) => {
  const ratelimit = getRateLimiter();
  const { success: rateLimitSuccess } = await ratelimit.limit(userId);
  if (!rateLimitSuccess) {
    return { success: false, message: "Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde." };
  }

  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }

    const validatedData = clientSchema.parse(formData);

    const data = await db
      .update(clients)
      .set({
        ...validatedData,
        email: validatedData.email || "",
      })
      .where(eq(clients.id, clientId))
      .returning();

    revalidatePath("/dashboard/clients");

    return { success: true, data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Datos del formulario no válidos." };
    }
    console.error("Database Error (updateClient):", error);
    return { success: false, message: "No se pudo actualizar el cliente." };
  }
};
