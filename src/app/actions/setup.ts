'use server';

import db from '@/lib/db';
import { csdCertificates } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const getSetupStatus = async (userId: string) => {
    if (!db) {
        return { success: false, message: "La conexión con la base de datos no está disponible.", data: { hasCsd: false } };
    }
    try {
        if (!userId) {
            return { success: false, message: "Usuario no autenticado.", data: { hasCsd: false } };
        }

        const existingCertificate = await db.select({ id: csdCertificates.id })
            .from(csdCertificates)
            .where(eq(csdCertificates.userId, userId))
            .limit(1);

        const hasCsd = existingCertificate.length > 0;

        return { success: true, data: { hasCsd } };

    } catch (error) {
        console.error("Database Error (getSetupStatus):", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        return { success: false, message: `Error al obtener el estado de la configuración: ${errorMessage}`, data: { hasCsd: false } };
    }
};

export const getCertificateDetails = async (userId: string) => {
    if (!db) {
        return { success: false, message: "La conexión con la base de datos no está disponible.", data: null };
    }
    try {
        if (!userId) {
            return { success: false, message: "Usuario no autenticado.", data: null };
        }

        const [certificate] = await db.select()
            .from(csdCertificates)
            .where(eq(csdCertificates.userId, userId))
            .limit(1);
        
        return { success: true, data: certificate ?? null };

    } catch (error) {
        console.error("Database Error (getCertificateDetails):", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        return { success: false, message: `Error al obtener los detalles del certificado: ${errorMessage}`, data: null };
    }
};