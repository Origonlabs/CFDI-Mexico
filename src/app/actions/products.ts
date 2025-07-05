
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { products } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const productSchema = z.object({
  description: z.string().min(1, { message: "La descripción es obligatoria." }),
  satKey: z.string().length(8, { message: "La clave SAT debe tener 8 caracteres." }),
  unitKey: z.string().min(1, { message: "La clave de unidad es obligatoria." }).max(3, { message: "La clave de unidad no puede tener más de 3 caracteres." }),
  unitPrice: z.coerce.number().min(0.01, { message: "El precio debe ser mayor a cero." }),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const getProducts = async (userId: string) => {
  if (!process.env.DATABASE_URL) {
    return { success: false, message: "La URL de la base de datos no está configurada." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db.select().from(products).where(eq(products.userId, userId));
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error al obtener los productos." };
  }
};

export const addProduct = async (formData: ProductFormValues, userId: string) => {
  if (!process.env.DATABASE_URL) {
    return { success: false, message: "La URL de la base de datos no está configurada." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    
    const validatedData = productSchema.parse(formData);
    
    const data = await db.insert(products).values({
      ...validatedData,
      unitPrice: validatedData.unitPrice.toString(),
      userId,
    }).returning();

    revalidatePath("/dashboard/products");
    
    return { success: true, data: data[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: "Datos del formulario no válidos.", errors: error.flatten().fieldErrors };
    }
    console.error(error);
    return { success: false, message: "No se pudo guardar el producto." };
  }
};
