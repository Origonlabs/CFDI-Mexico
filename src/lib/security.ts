/**
 * Utilidades de seguridad y protección
 * Proporciona funciones para validación de seguridad y protección contra ataques
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';
import { env } from './env';

const textEncoder = new TextEncoder();

function ensureSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API no está disponible en este entorno.');
  }
  return subtle;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function createHmacHex(message: string, secret: string): Promise<string> {
  const subtle = ensureSubtleCrypto();
  const keyMaterial = textEncoder.encode(secret);
  const cryptoKey = await subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await subtle.sign('HMAC', cryptoKey, textEncoder.encode(message));
  return arrayBufferToHex(signature);
}

/**
 * Valida que una IP esté en la lista de IPs permitidas
 */
export function validateIPWhitelist(ip: string, allowedIPs: string[]): boolean {
  if (allowedIPs.length === 0) return true; // Si no hay restricciones, permitir
  
  return allowedIPs.some(allowedIP => {
    if (allowedIP.includes('/')) {
      // CIDR notation
      return isIPInCIDR(ip, allowedIP);
    }
    return ip === allowedIP;
  });
}

/**
 * Verifica si una IP está en un rango CIDR
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [network, prefixLength] = cidr.split('/');
    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);
    const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;
    
    return (ipNum & mask) === (networkNum & mask);
  } catch {
    return false;
  }
}

/**
 * Convierte una IP a número
 */
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

/**
 * Valida el User-Agent para detectar bots maliciosos
 */
export function validateUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /java/i,
    /go-http/i,
    /libwww/i,
    /lwp/i,
  ];

  // Si no hay User-Agent, es sospechoso
  if (!userAgent || userAgent.trim().length === 0) {
    return false;
  }

  // Verificar patrones sospechosos
  return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Valida el Referer para prevenir CSRF
 */
export function validateReferer(
  referer: string | null,
  allowedOrigins: string[] = env.allowedOrigins.length > 0 ? env.allowedOrigins : ['*'],
): boolean {
  if (!referer || referer.trim().length === 0) {
    return env.allowMissingReferer || allowedOrigins.some((origin) => origin === '*');
  }
  
  try {
    const refererUrl = new URL(referer);
    return allowedOrigins.some(origin => {
      if (origin === '*') return true;
      return refererUrl.origin === origin;
    });
  } catch {
    return false;
  }
}

/**
 * Valida el tamaño del request para prevenir ataques de DoS
 */
export function validateRequestSize(contentLength: string | null, maxSize: number = 10 * 1024 * 1024): boolean {
  if (!contentLength) return true; // GET requests
  
  const size = parseInt(contentLength, 10);
  return !isNaN(size) && size <= maxSize;
}

/**
 * Valida la frecuencia de requests para prevenir ataques de fuerza bruta
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function validateRequestFrequency(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 minutos
): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = requestCounts.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset o primera vez
    requestCounts.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * Sanitiza headers para prevenir inyección
 */
export function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    // Sanitizar nombre del header
    const cleanKey = key.replace(/[^\w\-]/g, '');
    
    // Sanitizar valor del header
    const cleanValue = value.replace(/[\r\n]/g, '').trim();
    
    if (cleanKey && cleanValue) {
      sanitized[cleanKey] = cleanValue;
    }
  }
  
  return sanitized;
}

/**
 * Valida un token CSRF
 */
export async function validateCSRFToken(token: string, secret: string, timestamp: string): Promise<boolean> {
  try {
    // Verificar que el timestamp no sea muy antiguo (5 minutos)
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutos
    
    if (now - tokenTime > maxAge) {
      return false;
    }
    
    // Verificar el HMAC
    const expectedToken = await createHmacHex(timestamp, secret);
    return constantTimeEquals(expectedToken, token);
  } catch {
    return false;
  }
}

/**
 * Genera un token CSRF
 */
export async function generateCSRFToken(secret: string): Promise<{ token: string; timestamp: string }> {
  const timestamp = Date.now().toString();
  const token = await createHmacHex(timestamp, secret);
  return { token, timestamp };
}

/**
 * Valida la integridad de datos usando HMAC
 */
export async function validateDataIntegrity(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const expected = await createHmacHex(data, secret);
    return constantTimeEquals(expected, signature);
  } catch {
    return false;
  }
}

/**
 * Middleware de seguridad para requests
 */
export function securityMiddleware(request: NextRequest) {
  const securityIssues: string[] = [];
  
  // Validar User-Agent
  const userAgent = request.headers.get('user-agent');
  if (!validateUserAgent(userAgent || '')) {
    securityIssues.push('User-Agent sospechoso');
  }
  
  // Validar tamaño del request
  const contentLength = request.headers.get('content-length');
  if (!validateRequestSize(contentLength)) {
    securityIssues.push('Request demasiado grande');
  }
  
  // Validar IP (si está configurada una whitelist)
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const allowedIPs = env.allowedIPs;
  if (allowedIPs.length > 0 && !validateIPWhitelist(ip, allowedIPs)) {
    securityIssues.push('IP no autorizada');
  }
  
  // Validar Referer para requests POST/PUT/DELETE
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const referer = request.headers.get('referer');
    const allowedOrigins = env.allowedOrigins.length > 0 ? env.allowedOrigins : ['*'];

    if (!validateReferer(referer, allowedOrigins)) {
      securityIssues.push('Referer no válido');
    }
  }
  
  // Log de problemas de seguridad
  if (securityIssues.length > 0) {
    logger.security('Problemas de seguridad detectados', {
      issues: securityIssues,
      ip,
      userAgent,
      method: request.method,
      url: request.url,
    });
  }
  
  return {
    isValid: securityIssues.length === 0,
    issues: securityIssues,
  };
}

/**
 * Valida que un archivo sea seguro
 */
export function validateFileSecurity(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Validar tamaño
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    issues.push('Archivo demasiado grande');
  }
  
  // Validar extensión
  const allowedExtensions = ['.pdf', '.xml', '.cer', '.key', '.jpg', '.jpeg', '.png', '.webp'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    issues.push('Tipo de archivo no permitido');
  }
  
  // Validar tipo MIME
  const allowedMimeTypes = [
    'application/pdf',
    'text/xml',
    'application/x-x509-ca-cert',
    'application/x-pkcs12',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  
  if (!allowedMimeTypes.includes(file.type)) {
    issues.push('Tipo MIME no permitido');
  }
  
  // Validar nombre del archivo
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    issues.push('Nombre de archivo no válido');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Limpia datos de entrada para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .replace(/data:/gi, '') // Remover data: URLs
    .trim();
}

/**
 * Valida que una URL sea segura
 */
export function validateSecureURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Solo permitir HTTPS en producción
    if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // No permitir localhost en producción
    if (process.env.NODE_ENV === 'production' && 
        (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
