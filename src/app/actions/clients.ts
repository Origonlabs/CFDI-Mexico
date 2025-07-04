'use server';

import sql from '@/lib/db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema for validating client form data on the server.
const clientSchema = z.object({
  name: z.string().min(1, { message: "La razón social es obligatoria." }),
  rfc: z.string().min(12, { message: "El RFC debe tener 12 o 13 caracteres." }).max(13, { message: "El RFC debe tener 12 o 13 caracteres." }),
  email: z.string().email({ message: "El correo electrónico no es válido." }),
  zip: z.string().length(5, { message: "El código postal debe tener 5 dígitos." }),
  taxRegime: z.string().min(1, { message: "El régimen fiscal es obligatorio." }),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

/**
 * Fetches all clients for a given user from the database.
 * @param userId - The ID of the user whose clients to fetch.
 * @returns An object with success status and data or an error message.
 */
export async function getClients(userId: string) {
  if (!userId) return { success: false, message: 'Usuario no autenticado.' };
  try {
    // Use Neon's tagged template literal for safe, parameterized queries.
    // Note: Column names with uppercase letters or special characters must be double-quoted.
    const clients = await sql`
      SELECT id, name, rfc, email, created_at, zip, "taxRegime"
      FROM clients
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return { success: true, data: clients };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, message: 'No se pudieron cargar los clientes.' };
  }
}

/**
 * Adds a new client to the database for a given user.
 * @param formData - The client data from the form.
 * @param userId - The ID of the user adding the client.
 * @returns An object with success status and a message.
 */
export async function addClient(formData: ClientFormValues, userId: string) {
    if (!userId) return { success: false, message: 'Usuario no autenticado.' };

    const validatedFields = clientSchema.safeParse(formData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Datos de cliente inválidos.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { name, rfc, email, zip, taxRegime } = validatedFields.data;

    try {
        await sql`
            INSERT INTO clients (user_id, name, rfc, email, zip, "taxRegime")
            VALUES (${userId}, ${name}, ${rfc}, ${email}, ${zip}, ${taxRegime})
        `;
        // Revalidate the cache for the clients page, so the new client appears.
        revalidatePath('/dashboard/clients');
        return { success: true, message: 'Cliente guardado correctamente.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { success: false, message: 'No se pudo guardar el cliente.' };
    }
}
