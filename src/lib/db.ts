import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  // This check is important for type safety and to prevent runtime errors.
  // It ensures that the app won't run without the database connection string.
  throw new Error('DATABASE_URL environment variable is not set');
}

// Initialize the Neon serverless driver with the connection string.
const sql = neon(process.env.DATABASE_URL);

export default sql;
