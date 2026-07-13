declare const require: {
  (moduleName: string): any;
};

declare const process: {
  env: Record<string, string | undefined>;
};

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

import { schema } from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to connect to Supabase PostgreSQL.');
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
