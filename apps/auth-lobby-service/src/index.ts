import './telemetry';
import { config } from 'dotenv';
import { resolve } from 'node:path';

import { runDatabaseMigrations } from '@gitgud/database';
import { authLobbyEnv } from './config/env';
import { authLobbyApp } from './app';

config({ path: resolve(process.cwd(), '.env') });

async function start() {
  await runDatabaseMigrations();
  authLobbyApp.listen(authLobbyEnv.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Auth & Lobby Service listening on port ${authLobbyEnv.port}`);
  });
}

void start();
