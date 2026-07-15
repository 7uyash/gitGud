declare const require: {
  (moduleName: string): any;
};

declare const process: {
  env: Record<string, string | undefined>;
};

const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');

import { pool } from './client';

const migrationFiles = [
  resolve(__dirname, '..', 'migrations', '20260713000100_auth_lobby.sql'),
  resolve(__dirname, '..', 'migrations', '20260713000200_game_engine.sql'),
  resolve(__dirname, '..', 'migrations', '20260715000100_add_expected_solution_to_tasks.sql'),
];

export async function runDatabaseMigrations() {
  for (const migrationFile of migrationFiles) {
    const sql = await readFile(migrationFile, 'utf8');
    await pool.query(sql);
  }
}