/**
 * Middleware de autenticación y autorización
 * Proporciona funciones centralizadas para validar usuarios y permisos
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './firebase/admin';
import { logger } from './logger';
import { AuthenticationError, AuthorizationError, ConfigurationError } from './errors';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

/**
 * Extrae y valida el token de Firebase del request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser> {
  if (!adminAuth) {
    throw new ConfigurationError('Firebase Admin SDK no está configurado');
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Token de autorización no proporcionado');
  }

  const token = authHeader.substring(7);
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      customClaims: decodedToken,
    };
  } catch (error) {
    logger.auth('Token inválido', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw new AuthenticationError('Token inválido o expirado');
  }
}

/**
 * Middleware para validar autenticación en API routes
 */
export function withAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await getAuthenticatedUser(request);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 401 }
        );
      }
      
      logger.error('Error en middleware de autenticación', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      return NextResponse.json(
        { success: false, message: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware para validar permisos específicos
 */
export function withPermission(permission: string) {
  return function(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>) {
    return withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
      if (!user.customClaims?.permissions?.includes(permission)) {
        throw new AuthorizationError(`Permiso requerido: ${permission}`);
      }
      return await handler(request, user);
    });
  };
}

/**
 * Valida que el usuario tenga acceso a un recurso específico
 */
export function validateResourceAccess(userId: string, resourceUserId: string, resourceType: string): void {
  if (userId !== resourceUserId) {
    throw new AuthorizationError(`No tienes acceso a este ${resourceType}`);
  }
}

/**
 * Middleware para validar acceso a recursos del usuario
 */
export function withResourceAccess(resourceType: string) {
  return function(handler: (request: NextRequest, user: AuthenticatedUser, resourceId: string) => Promise<NextResponse>) {
    return withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
      const url = new URL(request.url);
      const resourceId = url.pathname.split('/').pop();
      
      if (!resourceId) {
        return NextResponse.json(
          { success: false, message: 'ID de recurso no proporcionado' },
          { status: 400 }
        );
      }

      // Aquí podrías agregar lógica adicional para validar el acceso al recurso
      // Por ejemplo, verificar en la base de datos que el recurso pertenece al usuario
      
      return await handler(request, user, resourceId);
    });
  };
}

/**
 * Middleware para logging de requests
 */
export function withLogging(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.api('Request iniciado', {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    }, undefined, requestId);

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;
      
      logger.api('Request completado', {
        method: request.method,
        url: request.url,
        status: response.status,
        duration: `${duration}ms`,
      }, undefined, requestId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Request falló', {
        method: request.method,
        url: request.url,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, undefined, requestId);

      throw error;
    }
  };
}

/**
 * Middleware para validar rate limiting
 */
export function withRateLimit(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // El rate limiting se maneja en las server actions
    // Este middleware podría implementar rate limiting adicional para API routes
    return await handler(request);
  };
}
