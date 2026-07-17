"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDatabaseMigrations = runDatabaseMigrations;
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const client_1 = require("./client");
const migrationFiles = [
    resolve(__dirname, '..', 'migrations', '20260713000100_auth_lobby.sql'),
    resolve(__dirname, '..', 'migrations', '20260713000200_game_engine.sql'),
    resolve(__dirname, '..', 'migrations', '20260715000100_add_expected_solution_to_tasks.sql'),
    resolve(__dirname, '..', 'migrations', '20260716000100_ai_agents.sql'),
];
async function runDatabaseMigrations() {
    for (const migrationFile of migrationFiles) {
        const sql = await readFile(migrationFile, 'utf8');
        await client_1.pool.query(sql);
    }
}
