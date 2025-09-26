/**
 * Middleware de Next.js para seguridad y autenticación
 * Se ejecuta antes de que las rutas sean procesadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from './security';
import { logger } from './logger';
import { generateRequestId } from './logger';

function parseDirectiveEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
}

export function middleware(request: NextRequest) {
  const requestId = generateRequestId();
  
  // Agregar request ID a los headers
  const response = NextResponse.next();
  response.headers.set('X-Request-ID', requestId);
  
  // Validaciones de seguridad
  const securityCheck = securityMiddleware(request);
  
  if (!securityCheck.isValid) {
    logger.security('Request bloqueado por seguridad', {
      issues: securityCheck.issues,
      url: request.url,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      requestId,
    });

    return new NextResponse('Acceso denegado', { 
      status: 403,
      headers: {
        'X-Request-ID': requestId,
      }
    });
  }
  
  // Headers de seguridad
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isSecureRequest = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';
  if (isSecureRequest) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  
  // CSP Header
  const additionalScriptSrc = parseDirectiveEnv(process.env.CSP_ADDITIONAL_SCRIPT_SRC);
  const additionalConnectSrc = parseDirectiveEnv(process.env.CSP_ADDITIONAL_CONNECT_SRC);
  const additionalFrameSrc = parseDirectiveEnv(process.env.CSP_ADDITIONAL_FRAME_SRC);

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://www.gstatic.com',
    'https://www.google.com',
    'https://pay.google.com',
    'https://*.paypal.com',
    'https://*.paypalobjects.com',
    ...additionalScriptSrc,
  ];

  const connectSrc = [
    "'self'",
    'https://*.googleapis.com',
    'https://*.firebase.com',
    'wss://*.firebase.com',
    'https://pay.google.com',
    'https://*.paypal.com',
    ...additionalConnectSrc,
  ];

  const frameSrc = [
    "'self'",
    'https://pay.google.com',
    'https://*.google.com',
    'https://*.paypal.com',
    'https://*.paypalobjects.com',
    ...additionalFrameSrc,
  ];

  const csp = [
    "default-src 'self'",
    `script-src ${Array.from(new Set(scriptSrc)).join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    `connect-src ${Array.from(new Set(connectSrc)).join(' ')}`,
    `frame-src ${Array.from(new Set(frameSrc)).join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Log del request
  logger.api('Request procesado', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    requestId,
  });
  
  return response;
}

// Configuración de rutas donde se aplica el middleware
export const config = {
  matcher: [
    /*
     * Aplicar a todas las rutas excepto:
     * - API routes que empiecen con /api/
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
