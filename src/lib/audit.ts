/**
 * Sistema de auditoría para operaciones críticas
 * Registra todas las acciones importantes para cumplimiento y seguridad
 */

import db from './db';
import { logger } from './logger';
import { auditLogs } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export enum AuditAction {
  // Autenticación
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  
  // Clientes
  CLIENT_CREATE = 'CLIENT_CREATE',
  CLIENT_UPDATE = 'CLIENT_UPDATE',
  CLIENT_DELETE = 'CLIENT_DELETE',
  
  // Facturas
  INVOICE_CREATE = 'INVOICE_CREATE',
  INVOICE_UPDATE = 'INVOICE_UPDATE',
  INVOICE_DELETE = 'INVOICE_DELETE',
  INVOICE_STAMP = 'INVOICE_STAMP',
  INVOICE_CANCEL = 'INVOICE_CANCEL',
  
  // Pagos
  PAYMENT_CREATE = 'PAYMENT_CREATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  PAYMENT_DELETE = 'PAYMENT_DELETE',
  PAYMENT_STAMP = 'PAYMENT_STAMP',
  PAYMENT_CANCEL = 'PAYMENT_CANCEL',
  
  // Productos
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  
  // Configuración
  COMPANY_UPDATE = 'COMPANY_UPDATE',
  CERTIFICATE_UPLOAD = 'CERTIFICATE_UPLOAD',
  CERTIFICATE_DELETE = 'CERTIFICATE_DELETE',
  
  // Sistema
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
}

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Registra una entrada de auditoría
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    if (!db) {
      logger.warn('Base de datos no disponible para auditoría', entry);
      return;
    }

    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      success: entry.success,
      errorMessage: entry.errorMessage,
      timestamp: new Date(),
    });

    // También loggear en el sistema de logging
    if (entry.success) {
      logger.info(`Audit: ${entry.action}`, {
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details,
      }, entry.userId);
    } else {
      logger.warn(`Audit Failed: ${entry.action}`, {
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        error: entry.errorMessage,
        details: entry.details,
      }, entry.userId);
    }
  } catch (error) {
    logger.error('Error al registrar auditoría', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entry,
    });
  }
}

/**
 * Helper para registrar operaciones exitosas
 */
export async function logSuccess(
  userId: string,
  action: AuditAction,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Helper para registrar operaciones fallidas
 */
export async function logFailure(
  userId: string,
  action: AuditAction,
  resourceType: string,
  errorMessage: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent,
    success: false,
    errorMessage,
  });
}

/**
 * Obtiene logs de auditoría para un usuario
 */
export async function getAuditLogs(
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  if (!db) {
    throw new Error('Base de datos no disponible');
  }

  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(auditLogs.timestamp)
    .limit(limit)
    .offset(offset);
}

/**
 * Obtiene logs de auditoría por acción
 */
export async function getAuditLogsByAction(
  action: AuditAction,
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  if (!db) {
    throw new Error('Base de datos no disponible');
  }

  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, action))
    .orderBy(auditLogs.timestamp)
    .limit(limit)
    .offset(offset);
}

/**
 * Middleware para auditoría automática de requests
 */
export function withAudit(action: AuditAction, resourceType: string) {
  return function(handler: Function) {
    return async function(...args: any[]) {
      const [request, user] = args;
      const startTime = Date.now();
      
      try {
        const result = await handler(...args);
        
        await logSuccess(
          user.uid,
          action,
          resourceType,
          result?.id?.toString(),
          {
            duration: Date.now() - startTime,
            method: request?.method,
            url: request?.url,
          },
          request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
          request?.headers?.get('user-agent')
        );
        
        return result;
      } catch (error) {
        await logFailure(
          user.uid,
          action,
          resourceType,
          error instanceof Error ? error.message : 'Unknown error',
          undefined,
          {
            duration: Date.now() - startTime,
            method: request?.method,
            url: request?.url,
          },
          request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
          request?.headers?.get('user-agent')
        );
        
        throw error;
      }
    };
  };
}
