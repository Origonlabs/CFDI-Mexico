
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { products } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const productSchema = z.object({
  code: z.string().max(50, "El código no debe exceder los 50 caracteres.").optional(),
  unitKey: z.string().min(1, { message: "La unidad es obligatoria." }),
  objetoImpuesto: z.string().min(1, { message: "El objeto de impuesto es obligatorio." }),
  description: z.string().min(1, { message: "La descripción es obligatoria." }),
  unitPrice: z.coerce.number().min(0, { message: "El precio unitario no puede ser negativo." }),
  satKey: z.string().min(1, { message: "La clave de producto es obligatoria." }),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const getProducts = async (userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }
    const data = await db.select().from(products).where(eq(products.userId, userId));
    return { success: true, data };
  } catch (error) {
    console.error("Database Error (getProducts):", error);
    return { success: false, message: "Error al obtener los productos. Verifique la consola del servidor para más detalles." };
  }
};

export const addProduct = async (formData: ProductFormValues, userId: string) => {
  if (!db) {
    return { success: false, message: "Error de configuración: La conexión con la base de datos no está disponible." };
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
    console.error("Database Error (addProduct):", error);
    return { success: false, message: "No se pudo guardar el producto. Verifique la consola del servidor para más detalles." };
  }
};
