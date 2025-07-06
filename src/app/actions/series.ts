
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { series } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const serieSchema = z.object({
  serie: z.string().min(1, "La serie es obligatoria.").max(10, "La serie no debe exceder los 10 caracteres."),
  folio: z.coerce.number().min(1, "El folio inicial debe ser al menos 1."),
  documentType: z.string().min(1, "El tipo de documento es obligatorio."),
});

export type SerieFormValues = z.infer<typeof serieSchema>;

export const getSeries = async (userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db.select().from(series).where(eq(series.userId, userId));
    return { success: true, data };
  } catch (error) {
    console.error("Database Error (getSeries):", error);
    return { success: false, message: "Error al obtener las series." };
  }
};

export const addSerie = async (formData: SerieFormValues, userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    
    const validatedData = serieSchema.parse(formData);

    // Check if serie already exists for this user
    const existingSerie = await db.select().from(series).where(and(eq(series.userId, userId), eq(series.serie, validatedData.serie)));
    if (existingSerie.length > 0) {
      return { success: false, message: `La serie '${validatedData.serie}' ya existe.` };
    }
    
    const data = await db.insert(series).values({
      ...validatedData,
      userId,
    }).returning();

    revalidatePath("/dashboard/settings");
    
    return { success: true, data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Datos del formulario no válidos." };
    }
    console.error("Database Error (addSerie):", error);
    return { success: false, message: "No se pudo guardar la serie." };
  }
};
