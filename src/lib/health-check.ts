/**
 * Sistema de health check y monitoreo
 * Proporciona endpoints para verificar el estado de la aplicación
 */

import db from './db';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    redis?: ServiceStatus;
    firebase?: ServiceStatus;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: number;
  };
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
}

/**
 * Verifica el estado de la base de datos
 */
async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    if (!db) {
      return {
        status: 'down',
        error: 'Database connection not configured'
      };
    }
    
    // Ejecutar una consulta simple
    await db.execute(sql`SELECT 1`);
    
    return {
      status: 'up',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verifica el estado de Redis
 */
async function checkRedis(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    const { Redis } = await import('@upstash/redis');
    
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return {
        status: 'down',
        error: 'Redis credentials not configured'
      };
    }
    
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    await redis.ping();
    
    return {
      status: 'up',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verifica el estado de Firebase
 */
async function checkFirebase(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    const { adminAuth } = await import('./firebase/admin');
    
    if (!adminAuth) {
      return {
        status: 'down',
        error: 'Firebase Admin SDK not configured'
      };
    }
    
    // Verificar que el servicio esté disponible
    await adminAuth.listUsers(1);
    
    return {
      status: 'up',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Obtiene métricas del sistema
 */
function getSystemMetrics(): { memoryUsage: NodeJS.MemoryUsage; cpuUsage?: number } {
  const memoryUsage = process.memoryUsage();
  
  // CPU usage es más complejo de obtener en Node.js
  // En producción, usar una librería como 'pidusage'
  let cpuUsage: number | undefined;
  
  try {
    const usage = process.cpuUsage();
    cpuUsage = (usage.user + usage.system) / 1000000; // Convertir a segundos
  } catch {
    // CPU usage no disponible
  }
  
  return { memoryUsage, cpuUsage };
}

/**
 * Realiza un health check completo
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    // Verificar servicios en paralelo
    const [databaseStatus, redisStatus, firebaseStatus] = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkFirebase()
    ]);
    
    const services = {
      database: databaseStatus.status === 'fulfilled' ? databaseStatus.value : { status: 'down' as const, error: 'Check failed' },
      redis: redisStatus.status === 'fulfilled' ? redisStatus.value : undefined,
      firebase: firebaseStatus.status === 'fulfilled' ? firebaseStatus.value : undefined,
    };
    
    // Determinar estado general
    const allServices = Object.values(services).filter(Boolean);
    const downServices = allServices.filter(service => service?.status === 'down');
    const degradedServices = allServices.filter(service => service?.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    
    if (downServices.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }
    
    const metrics = getSystemMetrics();
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services,
      metrics
    };
    
    // Log del health check
    logger.info('Health check completado', {
      status: overallStatus,
      duration: Date.now() - startTime,
      services: Object.keys(services).reduce((acc, key) => {
        acc[key] = services[key as keyof typeof services]?.status;
        return acc;
      }, {} as Record<string, string>)
    });
    
    return healthStatus;
  } catch (error) {
    logger.error('Error en health check', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: { status: 'down', error: 'Health check failed' }
      },
      metrics: getSystemMetrics()
    };
  }
}

/**
 * Health check simple (solo base de datos)
 */
export async function performSimpleHealthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    const dbStatus = await checkDatabase();
    
    if (dbStatus.status === 'up') {
      return { status: 'ok', message: 'Service is healthy' };
    } else {
      return { status: 'error', message: dbStatus.error || 'Database is down' };
    }
  } catch (error) {
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Health check para readiness probe (Kubernetes)
 */
export async function readinessCheck(): Promise<boolean> {
  try {
    const dbStatus = await checkDatabase();
    return dbStatus.status === 'up';
  } catch {
    return false;
  }
}

/**
 * Health check para liveness probe (Kubernetes)
 */
export async function livenessCheck(): Promise<boolean> {
  try {
    // Verificación básica de que la aplicación responde
    return process.uptime() > 0;
  } catch {
    return false;
  }
}
