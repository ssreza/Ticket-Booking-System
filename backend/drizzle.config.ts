import type { Config } from 'drizzle-kit';

export default {
  schema: './schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    user: 'user',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'ticketdb',
  },
} satisfies Config;
