
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../../../drizzle/schema';

let db: NeonHttpDatabase<typeof schema> | null;

if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
} else {
    console.warn("DATABASE_URL no está configurada. La base de datos no estará disponible.");
    db = null;
}

export default db;
