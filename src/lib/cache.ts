/**
 * Sistema de caché para optimizar rendimiento
 * Proporciona funciones para cachear datos frecuentemente accedidos
 */

import { Redis } from '@upstash/redis';
import { logger } from './logger';

let redis: Redis | null = null;

// Inicializar Redis si está disponible
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  logger.warn('Redis no configurado. El caché estará deshabilitado.');
}

// Caché en memoria como fallback
const memoryCache = new Map<string, { value: any; expires: number }>();

/**
 * Obtiene un valor del caché
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const value = await redis.get<T>(key);
      return value;
    } else {
      // Fallback a caché en memoria
      const cached = memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      } else if (cached) {
        memoryCache.delete(key);
      }
      return null;
    }
  } catch (error) {
    logger.error('Error al obtener del caché', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

/**
 * Establece un valor en el caché
 */
export async function set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
  try {
    if (redis) {
      await redis.setex(key, ttlSeconds, value);
      return true;
    } else {
      // Fallback a caché en memoria
      memoryCache.set(key, {
        value,
        expires: Date.now() + (ttlSeconds * 1000)
      });
      return true;
    }
  } catch (error) {
    logger.error('Error al establecer en caché', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

/**
 * Elimina un valor del caché
 */
export async function del(key: string): Promise<boolean> {
  try {
    if (redis) {
      await redis.del(key);
      return true;
    } else {
      memoryCache.delete(key);
      return true;
    }
  } catch (error) {
    logger.error('Error al eliminar del caché', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

/**
 * Elimina múltiples valores del caché
 */
export async function delPattern(pattern: string): Promise<boolean> {
  try {
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } else {
      // Fallback: eliminar del caché en memoria
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          memoryCache.delete(key);
        }
      }
      return true;
    }
  } catch (error) {
    logger.error('Error al eliminar patrón del caché', { pattern, error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

/**
 * Verifica si una clave existe en el caché
 */
export async function exists(key: string): Promise<boolean> {
  try {
    if (redis) {
      const result = await redis.exists(key);
      return result === 1;
    } else {
      const cached = memoryCache.get(key);
      return cached ? cached.expires > Date.now() : false;
    }
  } catch (error) {
    logger.error('Error al verificar existencia en caché', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

/**
 * Obtiene o establece un valor en el caché (cache-aside pattern)
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  try {
    // Intentar obtener del caché
    const cached = await get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, obtener de la fuente
    const value = await fetcher();
    
    // Guardar en caché
    await set(key, value, ttlSeconds);
    
    return value;
  } catch (error) {
    logger.error('Error en getOrSet', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    // Si hay error en el caché, intentar obtener directamente
    return await fetcher();
  }
}

/**
 * Invalida caché relacionado con un usuario
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  const patterns = [
    `user:${userId}:*`,
    `clients:${userId}:*`,
    `invoices:${userId}:*`,
    `payments:${userId}:*`,
    `products:${userId}:*`,
    `dashboard:${userId}:*`,
  ];

  for (const pattern of patterns) {
    await delPattern(pattern);
  }
}

/**
 * Invalida caché relacionado con un recurso específico
 */
export async function invalidateResourceCache(resourceType: string, resourceId: string, userId: string): Promise<void> {
  const patterns = [
    `${resourceType}:${resourceId}:*`,
    `${resourceType}:${userId}:*`,
    `dashboard:${userId}:*`,
  ];

  for (const pattern of patterns) {
    await delPattern(pattern);
  }
}

/**
 * Genera claves de caché consistentes
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  clients: (userId: string) => `clients:${userId}`,
  client: (userId: string, clientId: string) => `client:${userId}:${clientId}`,
  invoices: (userId: string) => `invoices:${userId}`,
  invoice: (userId: string, invoiceId: string) => `invoice:${userId}:${invoiceId}`,
  payments: (userId: string) => `payments:${userId}`,
  payment: (userId: string, paymentId: string) => `payment:${userId}:${paymentId}`,
  products: (userId: string) => `products:${userId}`,
  product: (userId: string, productId: string) => `product:${userId}:${productId}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  company: (userId: string) => `company:${userId}`,
  series: (userId: string) => `series:${userId}`,
  bankAccounts: (userId: string) => `bank_accounts:${userId}`,
};

/**
 * Configuración de TTL para diferentes tipos de datos
 */
export const cacheTTL = {
  user: 3600, // 1 hora
  clients: 1800, // 30 minutos
  invoices: 900, // 15 minutos
  payments: 900, // 15 minutos
  products: 3600, // 1 hora
  dashboard: 300, // 5 minutos
  company: 7200, // 2 horas
  series: 3600, // 1 hora
  bankAccounts: 3600, // 1 hora
};
