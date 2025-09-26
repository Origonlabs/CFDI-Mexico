/**
 * Sistema de logging centralizado para la aplicación
 * Proporciona diferentes niveles de log y formateo consistente
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key$/i,
  /credential/i,
  /authorization/i,
  /rfc/i,
  /email/i,
];

const MAX_CONTEXT_DEPTH = 3;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function maskString(value: string): string {
  if (!value) return '<redacted>';

  if (value.includes('@')) {
    const [user, domain] = value.split('@');
    const safeUser = user.length <= 2 ? `${user[0] ?? ''}*` : `${user.slice(0, 2)}***`;
    return `${safeUser}@${domain}`;
  }

  if (value.length <= 4) {
    return '*'.repeat(value.length);
  }

  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function maskSensitiveValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '<redacted>';
  }

  if (typeof value === 'string') {
    return maskString(value);
  }

  return '<redacted>';
}

function sanitizeValue(value: unknown, depth: number = 0): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.length > 256) {
      return `${value.slice(0, 128)}…[truncated:${value.length}]`;
    }
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return `<buffer:${value.length}b>`;
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_CONTEXT_DEPTH) {
      return '[array]';
    }
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (isPlainObject(value)) {
    if (depth >= MAX_CONTEXT_DEPTH) {
      return '[object]';
    }
    return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, currentValue]) => {
      if (SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        acc[key] = maskSensitiveValue(currentValue);
      } else {
        acc[key] = sanitizeValue(currentValue, depth + 1);
      }
      return acc;
    }, {});
  }

  return '<unsupported>';
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLog(level: string, message: string, context?: Record<string, any>, userId?: string, requestId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context: sanitizeValue(context) as Record<string, unknown> }),
      ...(userId && { userId }),
      ...(requestId && { requestId }),
    };
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // En desarrollo, usar console con colores
      const colors = {
        ERROR: '\x1b[31m', // Rojo
        WARN: '\x1b[33m',  // Amarillo
        INFO: '\x1b[36m',  // Cian
        DEBUG: '\x1b[90m', // Gris
        RESET: '\x1b[0m'
      };
      
      console.log(
        `${colors[entry.level as keyof typeof colors] || ''}[${entry.timestamp}] ${entry.level}: ${entry.message}${colors.RESET}`,
        entry.context ? entry.context : ''
      );
    } else {
      // En producción, usar formato JSON para sistemas de logging
      console.log(JSON.stringify(entry));
    }
  }

  error(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.formatLog('ERROR', message, context, userId, requestId);
      this.output(entry);
    }
  }

  warn(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatLog('WARN', message, context, userId, requestId);
      this.output(entry);
    }
  }

  info(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.formatLog('INFO', message, context, userId, requestId);
      this.output(entry);
    }
  }

  debug(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.formatLog('DEBUG', message, context, userId, requestId);
      this.output(entry);
    }
  }

  // Métodos específicos para diferentes contextos
  database(message: string, context?: Record<string, any>, userId?: string): void {
    this.info(`[DATABASE] ${message}`, context, userId);
  }

  auth(message: string, context?: Record<string, any>, userId?: string): void {
    this.info(`[AUTH] ${message}`, context, userId);
  }

  api(message: string, context?: Record<string, any>): void {
    this.info(`[API] ${message}`, context);
  }

  security(message: string, context?: Record<string, any>): void {
    this.warn(`[SECURITY] ${message}`, context);
  }

  business(message: string, context?: Record<string, any>): void {
    this.info(`[BUSINESS] ${message}`, context);
  }
}

// Instancia singleton
export const logger = new Logger();

// Función helper para generar request IDs únicos
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Función helper para logging de errores con stack trace
export function logError(error: Error, context?: Record<string, any>, userId?: string, requestId?: string): void {
  logger.error(error.message, {
    ...context,
    stack: error.stack,
    name: error.name,
  }, userId, requestId);
}
