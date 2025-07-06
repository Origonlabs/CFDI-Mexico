
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { clients } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const clientSchema = z.object({
  name: z.string().min(1, { message: "El nombre o razón social es obligatorio." }),
  rfc: z.string()
    .min(12, { message: "El RFC debe tener 12 o 13 caracteres." })
    .max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  zip: z.string().length(5, { message: "El código postal debe tener 5 dígitos." }),
  usoCfdi: z.string().min(1, { message: "El Uso del CFDI es obligatorio." }),
  taxRegime: z.string().min(1, { message: "El régimen fiscal es obligatorio." }),
  
  country: z.string().optional(),
  state: z.string().optional(),
  municipality: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  exteriorNumber: z.string().optional(),
  interiorNumber: z.string().optional(),
  email: z.string().email({ message: "El correo electrónico no es válido." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentForm: z.string().optional(),
  reference: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

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
