'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { clients } from '../../../drizzle/schema';
import db from '@/lib/db';
import { getRateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { logSuccess, logFailure, AuditAction } from '@/lib/audit';
import { 
  handleError, 
  createErrorResponse, 
  ValidationError,
  DatabaseError,
  NotFoundError,
  ConflictError
} from '@/lib/errors';
import { logError as logAppError } from '@/lib/logger';
import { 
  validateSchema, 
  sanitizeObject,
  validateRFC,
  validateEmail,
  validateCP,
  validatePhone,
  validateNotEmpty
} from '@/lib/validation';
import { clientSchema, type ClientFormValues } from '@/lib/schemas';

/**
 * Obtiene todos los clientes del usuario
 */
export const getClients = async (userId: string) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (!db) {
      throw new DatabaseError('La conexión con la base de datos no está disponible');
    }

    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

  logger.database('Obteniendo clientes', { userId, requestId }, userId);

    const userClients = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(clients.createdAt);

    logger.database('Clientes obtenidos exitosamente', { 
      count: userClients.length,
      requestId,
    }, userId);

    return { success: true, data: userClients };
  } catch (error) {
    const appError = handleError(error, { userId, requestId });
    logAppError(appError, { userId, requestId } as any);
    return createErrorResponse(appError, requestId);
  }
};

/**
 * Agrega un nuevo cliente
 */
export const addClient = async (formData: ClientFormValues, userId: string) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Rate limiting
    const ratelimit = getRateLimiter();
    const { success: rateLimitSuccess } = await ratelimit.limit(userId);
    if (!rateLimitSuccess) {
      throw new ConflictError('Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde');
    }

    if (!db) {
      throw new DatabaseError('La conexión con la base de datos no está disponible');
    }

    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    // Sanitizar y validar datos
    const sanitizedData = sanitizeObject(formData);
    const validatedData = validateSchema(clientSchema, sanitizedData);

    // Validaciones adicionales específicas del dominio
    const rfc = validateRFC(validatedData.rfc);
    const email = validatedData.email ? validateEmail(validatedData.email) : '';
    const cp = validateCP(validatedData.zip);
    const phone = validatedData.phone ? validatePhone(validatedData.phone) : undefined;

    logger.database('Creando nuevo cliente', { 
      rfc: rfc.substring(0, 4) + '***', // Log parcial por seguridad
      userId,
      requestId,
    }, userId);

    // Verificar si el RFC ya existe para este usuario
    const existingClient = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.rfc, rfc)))
      .limit(1);

    if (existingClient.length > 0) {
      throw new ConflictError('Ya existe un cliente con este RFC');
    }

    const data = await db.insert(clients).values({
      ...validatedData,
      rfc,
      email,
      zip: cp,
      phone,
      userId,
    }).returning();

    if (!data[0]) {
      throw new DatabaseError('No se pudo crear el cliente');
    }

    revalidatePath("/dashboard/clients");

    // Log de auditoría
    await logSuccess(
      userId,
      AuditAction.CLIENT_CREATE,
      'client',
      data[0].id.toString(),
      { rfc: rfc.substring(0, 4) + '***' },
      undefined,
      undefined
    );

    logger.database('Cliente creado exitosamente', { 
      clientId: data[0].id,
      requestId,
    }, userId);

    return { success: true, data: data[0] };
  } catch (error) {
    const appError = handleError(error, { userId, requestId });
    logAppError(appError, { userId, requestId } as any);

    // Log de auditoría para fallos
    if (appError instanceof ConflictError || appError instanceof ValidationError) {
      await logFailure(
        userId,
        AuditAction.CLIENT_CREATE,
        'client',
        appError.message,
        undefined,
        { rfc: formData.rfc?.substring(0, 4) + '***' }
      );
    }

    return createErrorResponse(appError, requestId);
  }
};

/**
 * Actualiza un cliente existente
 */
export const updateClient = async (
  clientId: number, 
  formData: ClientFormValues, 
  userId: string
) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Rate limiting
    const ratelimit = getRateLimiter();
    const { success: rateLimitSuccess } = await ratelimit.limit(userId);
    if (!rateLimitSuccess) {
      throw new ConflictError('Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde');
    }

    if (!db) {
      throw new DatabaseError('La conexión con la base de datos no está disponible');
    }

    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    // Sanitizar y validar datos
    const sanitizedData = sanitizeObject(formData);
    const validatedData = validateSchema(clientSchema, sanitizedData);

    // Validaciones adicionales específicas del dominio
    const rfc = validateRFC(validatedData.rfc);
    const email = validatedData.email ? validateEmail(validatedData.email) : '';
    const cp = validateCP(validatedData.zip);
    const phone = validatedData.phone ? validatePhone(validatedData.phone) : undefined;

    logger.database('Actualizando cliente', { 
      clientId,
      rfc: rfc.substring(0, 4) + '***',
      userId,
      requestId,
    }, userId);

    // Verificar que el cliente existe y pertenece al usuario
    const existingClient = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .limit(1);

    if (existingClient.length === 0) {
      throw new NotFoundError('Cliente');
    }

    // Verificar si el RFC ya existe en otro cliente del mismo usuario
    const duplicateClient = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(
        eq(clients.userId, userId), 
        eq(clients.rfc, rfc),
        // Excluir el cliente actual
        // Note: En Drizzle, necesitarías usar ne() para not equal
      ))
      .limit(1);

    if (duplicateClient.length > 0 && duplicateClient[0].id !== clientId) {
      throw new ConflictError('Ya existe otro cliente con este RFC');
    }

    const updatedData = await db
      .update(clients)
      .set({
        ...validatedData,
        rfc,
        email,
        zip: cp,
        phone,
      })
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .returning();

    if (!updatedData[0]) {
      throw new DatabaseError('No se pudo actualizar el cliente');
    }

    revalidatePath("/dashboard/clients");

    // Log de auditoría
    await logSuccess(
      userId,
      AuditAction.CLIENT_UPDATE,
      'client',
      clientId.toString(),
      { rfc: rfc.substring(0, 4) + '***' }
    );

    logger.database('Cliente actualizado exitosamente', { 
      clientId,
      requestId,
    }, userId);

    return { success: true, data: updatedData[0] };
  } catch (error) {
    const appError = handleError(error, { userId, requestId });
    logAppError(appError, { userId, requestId } as any);

    // Log de auditoría para fallos
    if (appError instanceof ConflictError || appError instanceof ValidationError || appError instanceof NotFoundError) {
      await logFailure(
        userId,
        AuditAction.CLIENT_UPDATE,
        'client',
        appError.message,
        clientId.toString(),
        { rfc: formData.rfc?.substring(0, 4) + '***' }
      );
    }

    return createErrorResponse(appError, requestId);
  }
};

/**
 * Elimina un cliente
 */
export const deleteClient = async (clientId: number, userId: string) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Rate limiting
    const ratelimit = getRateLimiter();
    const { success: rateLimitSuccess } = await ratelimit.limit(userId);
    if (!rateLimitSuccess) {
      throw new ConflictError('Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde');
    }

    if (!db) {
      throw new DatabaseError('La conexión con la base de datos no está disponible');
    }

    if (!userId) {
      throw new ValidationError('Usuario no autenticado');
    }

    logger.database('Eliminando cliente', { 
      clientId,
      userId,
      requestId,
    }, userId);

    // Verificar que el cliente existe y pertenece al usuario
    const existingClient = await db
      .select({ id: clients.id, rfc: clients.rfc })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .limit(1);

    if (existingClient.length === 0) {
      throw new NotFoundError('Cliente');
    }

    // TODO: Verificar si el cliente tiene facturas asociadas
    // Si las tiene, no permitir eliminación o hacer soft delete

    const deletedData = await db
      .delete(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
      .returning();

    if (!deletedData[0]) {
      throw new DatabaseError('No se pudo eliminar el cliente');
    }

    revalidatePath("/dashboard/clients");

    // Log de auditoría
    await logSuccess(
      userId,
      AuditAction.CLIENT_DELETE,
      'client',
      clientId.toString(),
      { rfc: existingClient[0].rfc.substring(0, 4) + '***' }
    );

    logger.database('Cliente eliminado exitosamente', { 
      clientId,
      requestId,
    }, userId);

    return { success: true, message: 'Cliente eliminado exitosamente' };
  } catch (error) {
    const appError = handleError(error, { userId, requestId });
    logError(appError, { userId, requestId });

    // Log de auditoría para fallos
    if (appError instanceof NotFoundError || appError instanceof ValidationError) {
      await logFailure(
        userId,
        AuditAction.CLIENT_DELETE,
        'client',
        appError.message,
        clientId.toString()
      );
    }

    return createErrorResponse(appError, requestId);
  }
};
