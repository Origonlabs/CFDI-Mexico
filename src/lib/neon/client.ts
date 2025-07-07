
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../../../drizzle/schema';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var db: NeonHttpDatabase<typeof schema> | undefined;
}

let dbInstance: NeonHttpDatabase<typeof schema> | null;

const dbUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production') {
  if (dbUrl) {
    const sql = neon(dbUrl);
    dbInstance = drizzle(sql, { schema });
  } else {
    dbInstance = null;
  }
} else {
  if (!global.db) {
    if (dbUrl) {
      const sql = neon(dbUrl);
      global.db = drizzle(sql, { schema });
    } else {
      global.db = undefined;
    }
  }
  dbInstance = global.db ?? null;
}

if (!dbInstance) {
    console.warn("DATABASE_URL no está configurada. La base de datos no estará disponible.");
}

export default dbInstance;
