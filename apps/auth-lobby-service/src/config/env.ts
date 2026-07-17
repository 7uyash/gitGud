import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '..', '..', '.env') });

function readNumberEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);
  if (Number.isNaN(parsedValue)) {
    throw new Error(`${name} must be a valid number.`);
  }

  return parsedValue;
}

function readRequiredEnv(name: string, fallback?: string): string {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`${name} is required.`);
  }

  return rawValue;
}

export const authLobbyEnv = {
  port: readNumberEnv('AUTH_LOBBY_PORT', readNumberEnv('PORT', 4101)),
  jwtSecret: readRequiredEnv('JWT_SECRET', 'gitgud-dev-secret'),
  githubClientId: readRequiredEnv('GITHUB_CLIENT_ID', 'dummy'),
  githubClientSecret: readRequiredEnv('GITHUB_CLIENT_SECRET', 'dummy'),
  githubCallbackUrl: readRequiredEnv('GITHUB_CALLBACK_URL', 'http://localhost:4101/auth/github/callback'),
  googleClientId: readRequiredEnv('GOOGLE_CLIENT_ID', 'dummy'),
  googleClientSecret: readRequiredEnv('GOOGLE_CLIENT_SECRET', 'dummy'),
  googleCallbackUrl: readRequiredEnv('GOOGLE_CALLBACK_URL', 'http://localhost:4101/auth/google/callback'),
  frontendUrl: readRequiredEnv('FRONTEND_URL', 'http://localhost:5173'),
};
