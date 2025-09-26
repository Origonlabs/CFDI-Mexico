/**
 * Optimizaciones de base de datos y consultas
 * Proporciona funciones para consultas optimizadas y paginación
 */

import { eq, and, desc, asc, sql, count, type SQL } from 'drizzle-orm';
import db from './db';
import { logger } from './logger';
import { get, set, cacheKeys, cacheTTL } from './cache';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Aplica paginación a una consulta
 */
export function applyPagination(
  query: any,
  options: PaginationOptions
) {
  const { page, limit, sortBy, sortOrder = 'desc' } = options;
  const offset = (page - 1) * limit;

  let paginatedQuery = query.limit(limit).offset(offset);

  if (sortBy) {
    const orderFn = sortOrder === 'asc' ? asc : desc;
    paginatedQuery = paginatedQuery.orderBy(orderFn(query[sortBy]));
  }

  return paginatedQuery;
}

/**
 * Obtiene el total de registros para paginación
 */
export async function getTotalCount(table: any, whereClause?: SQL): Promise<number> {
  try {
    const query = db.select({ count: count() }).from(table);
    const result = whereClause ? query.where(whereClause) : query;
    const [{ count: total }] = await result;
    return total;
  } catch (error) {
    logger.error('Error al obtener conteo total', { 
      table: table._.name,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return 0;
  }
}

/**
 * Crea un resultado paginado
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResult<T> {
  const { page, limit } = options;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Obtiene estadísticas del dashboard con caché
 */
export async function getDashboardStats(userId: string) {
  const cacheKey = cacheKeys.dashboard(userId);
  
  return await get(cacheKey) || await set(cacheKey, async () => {
    if (!db) {
      throw new Error('Base de datos no disponible');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf90DaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

    try {
      // Consulta optimizada con múltiples estadísticas en una sola query
      const stats = await db.execute(sql`
        SELECT 
          COALESCE(SUM(CASE WHEN i.created_at >= ${startOfMonth} AND i.status = 'stamped' THEN i.total::numeric ELSE 0 END), 0) as total_facturado_mes,
          COUNT(CASE WHEN i.created_at >= ${startOfMonth} AND i.status = 'stamped' THEN 1 END) as facturas_timbradas_mes,
          COUNT(DISTINCT c.id) as clientes_activos,
          COALESCE(SUM(CASE WHEN i.status = 'draft' THEN i.total::numeric ELSE 0 END), 0) as saldo_pendiente,
          COALESCE(SUM(CASE WHEN i.created_at >= ${startOf90DaysAgo} AND i.status = 'stamped' THEN i.total::numeric ELSE 0 END), 0) as facturacion_ultimos_90_dias
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.user_id = ${userId}
      `);

      return stats[0];
    } catch (error) {
      logger.error('Error al obtener estadísticas del dashboard', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, cacheTTL.dashboard);
}

/**
 * Obtiene clientes con paginación y caché
 */
export async function getClientsPaginated(
  userId: string,
  options: PaginationOptions
): Promise<PaginatedResult<any>> {
  const cacheKey = `${cacheKeys.clients(userId)}:page:${options.page}:limit:${options.limit}`;
  
  return await get(cacheKey) || await set(cacheKey, async () => {
    if (!db) {
      throw new Error('Base de datos no disponible');
    }

    try {
      const { clients } = await import('../../../drizzle/schema');
      const whereClause = eq(clients.userId, userId);

      // Obtener total
      const total = await getTotalCount(clients, whereClause);

      // Obtener datos paginados
      const query = db.select().from(clients).where(whereClause);
      const paginatedQuery = applyPagination(query, options);
      const data = await paginatedQuery;

      return createPaginatedResult(data, total, options);
    } catch (error) {
      logger.error('Error al obtener clientes paginados', { 
        userId,
        options,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, cacheTTL.clients);
}

/**
 * Obtiene facturas con paginación y filtros
 */
export async function getInvoicesPaginated(
  userId: string,
  options: PaginationOptions,
  filters?: {
    status?: string;
    clientId?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }
): Promise<PaginatedResult<any>> {
  const cacheKey = `${cacheKeys.invoices(userId)}:page:${options.page}:limit:${options.limit}:filters:${JSON.stringify(filters || {})}`;
  
  return await get(cacheKey) || await set(cacheKey, async () => {
    if (!db) {
      throw new Error('Base de datos no disponible');
    }

    try {
      const { invoices, clients } = await import('../../../drizzle/schema');
      
      // Construir condiciones WHERE
      const conditions = [eq(invoices.userId, userId)];
      
      if (filters?.status) {
        conditions.push(eq(invoices.status, filters.status as any));
      }
      
      if (filters?.clientId) {
        conditions.push(eq(invoices.clientId, filters.clientId));
      }
      
      if (filters?.dateFrom) {
        conditions.push(sql`${invoices.createdAt} >= ${filters.dateFrom}`);
      }
      
      if (filters?.dateTo) {
        conditions.push(sql`${invoices.createdAt} <= ${filters.dateTo}`);
      }

      const whereClause = and(...conditions);

      // Obtener total
      const total = await getTotalCount(invoices, whereClause);

      // Obtener datos paginados con JOIN para información del cliente
      const query = db
        .select({
          id: invoices.id,
          serie: invoices.serie,
          folio: invoices.folio,
          total: invoices.total,
          status: invoices.status,
          createdAt: invoices.createdAt,
          clientName: clients.name,
          clientRfc: clients.rfc,
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(whereClause);

      const paginatedQuery = applyPagination(query, options);
      const data = await paginatedQuery;

      return createPaginatedResult(data, total, options);
    } catch (error) {
      logger.error('Error al obtener facturas paginadas', { 
        userId,
        options,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, cacheTTL.invoices);
}

/**
 * Obtiene productos con búsqueda y paginación
 */
export async function getProductsPaginated(
  userId: string,
  options: PaginationOptions,
  searchTerm?: string
): Promise<PaginatedResult<any>> {
  const cacheKey = `${cacheKeys.products(userId)}:page:${options.page}:limit:${options.limit}:search:${searchTerm || ''}`;
  
  return await get(cacheKey) || await set(cacheKey, async () => {
    if (!db) {
      throw new Error('Base de datos no disponible');
    }

    try {
      const { products } = await import('../../../drizzle/schema');
      
      // Construir condiciones WHERE
      const conditions = [eq(products.userId, userId)];
      
      if (searchTerm) {
        conditions.push(sql`(
          ${products.description} ILIKE ${`%${searchTerm}%`} OR
          ${products.code} ILIKE ${`%${searchTerm}%`}
        )`);
      }

      const whereClause = and(...conditions);

      // Obtener total
      const total = await getTotalCount(products, whereClause);

      // Obtener datos paginados
      const query = db.select().from(products).where(whereClause);
      const paginatedQuery = applyPagination(query, options);
      const data = await paginatedQuery;

      return createPaginatedResult(data, total, options);
    } catch (error) {
      logger.error('Error al obtener productos paginados', { 
        userId,
        options,
        searchTerm,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, cacheTTL.products);
}

/**
 * Optimiza consultas con índices sugeridos
 */
export const suggestedIndexes = [
  // Índices para invoices
  'CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);',
  'CREATE INDEX IF NOT EXISTS idx_invoices_user_created ON invoices(user_id, created_at);',
  'CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);',
  
  // Índices para clients
  'CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_clients_user_rfc ON clients(user_id, rfc);',
  
  // Índices para products
  'CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_products_user_description ON products(user_id, description);',
  
  // Índices para payments
  'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);',
  
  // Índices para audit_logs
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);',
];

/**
 * Aplica índices sugeridos a la base de datos
 */
export async function applySuggestedIndexes(): Promise<void> {
  if (!db) {
    logger.warn('Base de datos no disponible para aplicar índices');
    return;
  }

  try {
    for (const indexQuery of suggestedIndexes) {
      await db.execute(sql.raw(indexQuery));
    }
    logger.info('Índices aplicados exitosamente');
  } catch (error) {
    logger.error('Error al aplicar índices', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
