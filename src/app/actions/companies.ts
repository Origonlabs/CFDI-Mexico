
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { companies } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const profileFormSchema = z.object({
  companyName: z.string().min(1, { message: "La razón social es obligatoria." }),
  rfc: z.string()
    .min(12, { message: "El RFC debe tener 12 o 13 caracteres." })
    .max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  address: z.string().min(1, { message: "La dirección fiscal es obligatoria." }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const getCompanyProfile = async (userId: string) => {
  if (!db) {
    return { success: false, message: "La URL de la base de datos no está configurada." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db.select().from(companies).where(eq(companies.userId, userId));
    return { success: true, data: data[0] };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error al obtener el perfil de la empresa." };
  }
};

export const saveCompanyProfile = async (formData: ProfileFormValues, userId: string) => {
  if (!db) {
    return { success: false, message: "La URL de la base de datos no está configurada." };
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
    console.error(error);
    return { success: false, message: "No se pudo guardar el perfil de la empresa." };
  }
};
