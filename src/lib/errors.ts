/**
 * Sistema de manejo de errores centralizado
 * Proporciona tipos de error específicos y manejo consistente
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Mantener el stack trace correcto
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores específicos del dominio
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autorizado', context?: Record<string, any>) {
    super(message, 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acceso denegado', context?: Record<string, any>) {
    super(message, 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} no encontrado`, 404, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Demasiadas solicitudes', context?: Record<string, any>) {
    super(message, 429, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, false, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, any>) {
    super(`Error del servicio ${service}: ${message}`, 502, false, context);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Error de configuración: ${message}`, 500, false, context);
  }
}

// Función helper para manejar errores de forma consistente
export function handleError(error: unknown, context?: Record<string, any>): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Error de base de datos
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      return new ConflictError('El recurso ya existe', context);
    }

    if (error.message.includes('foreign key') || error.message.includes('constraint')) {
      return new ValidationError('Datos relacionados no válidos', context);
    }

    if (error.message.includes('connection') || error.message.includes('timeout')) {
      return new DatabaseError('Error de conexión a la base de datos', context);
    }

    // Error genérico
    return new AppError(error.message, 500, false, context);
  }

  // Error desconocido
  return new AppError('Error interno del servidor', 500, false, context);
}

// Función para crear respuestas de error consistentes
export function createErrorResponse(error: AppError, requestId?: string) {
  return {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    ...(requestId && { requestId }),
    ...(process.env.NODE_ENV === 'development' && error.context && { context: error.context }),
  };
}

// Función para logging de errores
export function logError(error: AppError, userId?: string, requestId?: string): void {
  const { logger } = require('./logger');
  
  if (error.statusCode >= 500) {
    logger.error(error.message, {
      ...error.context,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    }, userId, requestId);
  } else {
    logger.warn(error.message, {
      ...error.context,
      statusCode: error.statusCode,
    }, userId, requestId);
  }
}
