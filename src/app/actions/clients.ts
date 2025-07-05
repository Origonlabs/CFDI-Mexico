
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { clients } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const clientSchema = z.object({
  name: z.string().min(1, { message: "La razón social es obligatoria." }),
  rfc: z.string()
    .min(12, { message: "El RFC debe tener 12 o 13 caracteres." })
    .max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  email: z.string().email({ message: "El correo electrónico no es válido." }),
  zip: z.string().length(5, { message: "El código postal debe tener 5 dígitos." }),
  taxRegime: z.string().min(1, { message: "El régimen fiscal es obligatorio." }),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const getClients = async (userId: string) => {
  if (!db) {
    return { success: false, message: "La URL de la base de datos no está configurada." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db.select().from(clients).where(eq(clients.userId, userId));
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error al obtener los clientes." };
  }
};

export const addClient = async (formData: ClientFormValues, userId: string) => {
  if (!db) {
    return { success: false, message: "La URL de la base de datos no está configurada." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    
    const validatedData = clientSchema.parse(formData);
    
    const data = await db.insert(clients).values({
      ...validatedData,
      userId,
    }).returning();

    revalidatePath("/dashboard/clients");
    
    return { success: true, data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Datos del formulario no válidos." };
    }
    console.error(error);
    return { success: false, message: "No se pudo guardar el cliente." };
  }
};
