"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema_1 = require("./schema");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to connect to Supabase PostgreSQL.');
}
exports.pool = new Pool({ connectionString: databaseUrl });
exports.db = drizzle(exports.pool, { schema: schema_1.schema });
