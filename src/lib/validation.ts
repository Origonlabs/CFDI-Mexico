/**
 * Utilidades de validación y sanitización
 * Proporciona funciones centralizadas para validar y limpiar datos
 */

import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Sanitiza strings eliminando caracteres peligrosos
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, ''); // Remover event handlers
}

/**
 * Sanitiza números asegurándose de que sean válidos
 */
export function sanitizeNumber(input: any): number {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) {
    throw new ValidationError('Número inválido');
  }
  return num;
}

/**
 * Valida y sanitiza un RFC mexicano
 */
export function validateRFC(rfc: string): string {
  const sanitized = sanitizeString(rfc).toUpperCase();
  
  // RFC persona física: 13 caracteres
  // RFC persona moral: 12 caracteres
  if (sanitized.length !== 12 && sanitized.length !== 13) {
    throw new ValidationError('El RFC debe tener 12 o 13 caracteres');
  }
  
  // Validar formato básico
  const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  if (!rfcRegex.test(sanitized)) {
    throw new ValidationError('Formato de RFC inválido');
  }
  
  return sanitized;
}

/**
 * Valida y sanitiza un código postal mexicano
 */
export function validateCP(cp: string): string {
  const sanitized = sanitizeString(cp);
  
  if (!/^\d{5}$/.test(sanitized)) {
    throw new ValidationError('El código postal debe tener 5 dígitos');
  }
  
  return sanitized;
}

/**
 * Valida y sanitiza un email
 */
export function validateEmail(email: string): string {
  const sanitized = sanitizeString(email).toLowerCase();
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new ValidationError('Formato de email inválido');
  }
  
  return sanitized;
}

/**
 * Valida y sanitiza un teléfono mexicano
 */
export function validatePhone(phone: string): string {
  const sanitized = sanitizeString(phone).replace(/\D/g, ''); // Solo números
  
  if (sanitized.length < 10 || sanitized.length > 12) {
    throw new ValidationError('El teléfono debe tener entre 10 y 12 dígitos');
  }
  
  return sanitized;
}

/**
 * Valida que un string no esté vacío
 */
export function validateNotEmpty(value: string, fieldName: string): string {
  const sanitized = sanitizeString(value);
  
  if (!sanitized) {
    throw new ValidationError(`${fieldName} es obligatorio`);
  }
  
  return sanitized;
}

/**
 * Valida que un número sea positivo
 */
export function validatePositiveNumber(value: number, fieldName: string): number {
  const sanitized = sanitizeNumber(value);
  
  if (sanitized <= 0) {
    throw new ValidationError(`${fieldName} debe ser mayor a 0`);
  }
  
  return sanitized;
}

/**
 * Valida que un número esté en un rango específico
 */
export function validateNumberRange(
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): number {
  const sanitized = sanitizeNumber(value);
  
  if (sanitized < min || sanitized > max) {
    throw new ValidationError(`${fieldName} debe estar entre ${min} y ${max}`);
  }
  
  return sanitized;
}

/**
 * Valida un UUID
 */
export function validateUUID(uuid: string): string {
  const sanitized = sanitizeString(uuid);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sanitized)) {
    throw new ValidationError('UUID inválido');
  }
  
  return sanitized;
}

/**
 * Valida una fecha
 */
export function validateDate(date: string | Date, fieldName: string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    throw new ValidationError(`${fieldName} no es una fecha válida`);
  }
  
  return dateObj;
}

/**
 * Valida que una fecha no sea futura
 */
export function validateNotFutureDate(date: string | Date, fieldName: string): Date {
  const dateObj = validateDate(date, fieldName);
  
  if (dateObj > new Date()) {
    throw new ValidationError(`${fieldName} no puede ser una fecha futura`);
  }
  
  return dateObj;
}

/**
 * Valida un objeto contra un esquema Zod
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0];
      throw new ValidationError(firstError || 'Datos de entrada no válidos', fieldErrors);
    }
    throw error;
  }
}

/**
 * Sanitiza un objeto recursivamente
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Valida que un array no esté vacío
 */
export function validateNonEmptyArray<T>(arr: T[], fieldName: string): T[] {
  if (!Array.isArray(arr)) {
    throw new ValidationError(`${fieldName} debe ser un array`);
  }
  
  if (arr.length === 0) {
    throw new ValidationError(`${fieldName} no puede estar vacío`);
  }
  
  return arr;
}

/**
 * Valida que un string tenga una longitud específica
 */
export function validateStringLength(
  value: string, 
  min: number, 
  max: number, 
  fieldName: string
): string {
  const sanitized = sanitizeString(value);
  
  if (sanitized.length < min || sanitized.length > max) {
    throw new ValidationError(`${fieldName} debe tener entre ${min} y ${max} caracteres`);
  }
  
  return sanitized;
}
