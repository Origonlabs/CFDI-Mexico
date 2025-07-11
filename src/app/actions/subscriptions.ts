
'use server';

import db from '@/lib/db';
import { subscriptions } from '../../../drizzle/schema';
import { and, eq } from 'drizzle-orm';

export const getActiveSubscription = async (userId: string) => {
  if (!db) {
    return { success: false, message: "La conexión con la base de datos no está disponible." };
  }
  try {
    if (!userId) {
      return { success: false, message: "Usuario no autenticado." };
    }

    const [subscription] = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ))
      .limit(1);

    if (subscription) {
      return { success: true, data: subscription };
    } else {
      return { success: true, data: null };
    }

  } catch (error) {
    console.error("Database Error (getActiveSubscription):", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al obtener la suscripción: ${errorMessage}` };
  }
};
