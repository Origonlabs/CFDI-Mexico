
"use server";

import * as z from "zod";
import db from "@/lib/db";
import { products } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { productSchema, type ProductFormValues } from "@/lib/schemas";

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
