import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import * as schema from './schema.js';

// Configuration for the PostgreSQL connection pool
// Using hardcoded values that match the docker-compose.yml configuration
const pool = new Pool({
  user: 'user',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'ticketdb',
  // High concurrency setting: Adjust pool size based on expected load
  // 20 is a good starting point for moderate concurrent users
  max: 20, 
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Error after 2 seconds if unable to connect
});

// Initialize Drizzle ORM with the connection pool
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
