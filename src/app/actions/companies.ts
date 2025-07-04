'use server';

import sql from '@/lib/db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const profileFormSchema = z.object({
  companyName: z.string().min(1, { message: "La razón social es obligatoria." }),
  rfc: z.string().min(12, { message: "El RFC debe tener 12 o 13 caracteres." }).max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  address: z.string().min(1, { message: "La dirección fiscal es obligatoria." }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export async function getCompanyProfile(userId: string) {
    if (!userId) return { success: false, message: 'Usuario no autenticado.' };
    try {
        const result = await sql`
            SELECT "companyName", rfc, address
            FROM companies
            WHERE id = ${userId}
        `;
        // Return the first record found, or null if none exists.
        return { success: true, data: result[0] || null };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, message: 'No se pudo cargar el perfil de la empresa.' };
    }
}

export async function saveCompanyProfile(formData: ProfileFormValues, userId: string) {
    if (!userId) return { success: false, message: 'Usuario no autenticado.' };

    const validatedFields = profileFormSchema.safeParse(formData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Datos de empresa inválidos.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { companyName, rfc, address } = validatedFields.data;

    try {
        // Neon serverless driver doesn't directly support `ON CONFLICT` (UPSERT) in a single command,
        // so we perform a check first. This is a common pattern for such environments.
        const existing = await sql`SELECT id FROM companies WHERE id = ${userId}`;

        if (existing.length > 0) {
            // If company exists, update it.
            await sql`
                UPDATE companies
                SET "companyName" = ${companyName}, rfc = ${rfc}, address = ${address}
                WHERE id = ${userId}
            `;
        } else {
            // If company doesn't exist, insert a new record.
            await sql`
                INSERT INTO companies (id, "companyName", rfc, address)
                VALUES (${userId}, ${companyName}, ${rfc}, ${address})
            `;
        }
        
        revalidatePath('/dashboard/settings');
        return { success: true, message: 'Perfil de la empresa guardado correctamente.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, message: 'No se pudo guardar el perfil de la empresa.' };
    }
}
