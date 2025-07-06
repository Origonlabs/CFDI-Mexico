
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { companies } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const profileFormSchema = z.object({
  companyName: z.string().min(1, { message: "La razón social es obligatoria." }),
  rfc: z.string()
    .min(12, { message: "El RFC debe tener 12 o 13 caracteres." })
    .max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  taxRegime: z.string().min(1, { message: "El régimen fiscal es obligatorio." }),
  street: z.string().optional(),
  exteriorNumber: z.string().optional(),
  interiorNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  sector: z.string().optional(),
  municipality: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  fax: z.string().optional(),
  contadorEmail: z.string().email({ message: "El correo del contador no es válido." }).optional().or(z.literal('')),
  web: z.string().url({ message: "La URL del sitio web no es válida." }).optional().or(z.literal('')),
  commercialMessage: z.string().optional(),
  logoUrl: z.string().url({ message: "Por favor, introduce una URL válida para el logo."}).optional().or(z.literal('')),
  defaultEmailMessage: z.string().optional(),
  templateCfdi33: z.string().optional(),
  templateCfdi40: z.string().optional(),
  templateRep: z.string().optional(),
});


export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const getCompanyProfile = async (userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db.select().from(companies).where(eq(companies.userId, userId));
    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Database Error (getCompanyProfile):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al obtener el perfil de la empresa. Verifique la consola del servidor para más detalles: ${errorMessage}` };
  }
};

export const saveCompanyProfile = async (formData: ProfileFormValues, userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }

    const validatedData = profileFormSchema.parse(formData);
    
    const existingProfile = await db.select({id: companies.id}).from(companies).where(eq(companies.userId, userId));
    
    if (existingProfile.length > 0) {
      const updatedData = await db
        .update(companies)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(companies.userId, userId))
        .returning();
      revalidatePath("/dashboard/settings");
      return { success: true, data: updatedData[0], message: "Perfil de empresa actualizado." };
    } else {
      const newData = await db
        .insert(companies)
        .values({ ...validatedData, userId })
        .returning();
      revalidatePath("/dashboard/settings");
      return { success: true, data: newData[0], message: "Perfil de empresa guardado." };
    }
  } catch (error) {
     if (error instanceof z.ZodError) {
      return { success: false, message: "Datos del formulario no válidos." };
    }
    console.error("Database Error (saveCompanyProfile):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `No se pudo guardar el perfil de la empresa. Verifique la consola del servidor para más detalles: ${errorMessage}` };
  }
};
