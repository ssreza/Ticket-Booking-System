import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

/**
 * PostgreSQL Connection Pool Configuration
 * Configured to match docker-compose.yml settings
 */
const pool = new Pool({
  user: 'user',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'ticketdb',
  max: 20, // Support ~500 concurrent users with proper pooling
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Drizzle ORM instance
 * Provides type-safe database queries
 */
export const db = drizzle(pool, { schema });

// Test the connection on startup
pool.on('connect', () => {
  console.log('Database connected successfully!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1); // Exit process if database connectivity is critical
});

/**
 * Gets a client from the pool for transactions.
 * Use this for complex operations that require transactions.
 * @returns A promise that resolves to a PG client.
 */
export const getClient = () => {
  return pool.connect();
};

/**
 * Creates a transaction using Drizzle ORM.
 * This is the recommended way to handle transactions with Drizzle.
 * @param callback Function containing the transaction logic
 * @returns Promise with the transaction result
 */
export const transaction = async <T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> => {
  return await db.transaction(callback);
};

// Export the schema for use in other files
export { schema };

// Export pool for compatibility if needed
export default pool;
