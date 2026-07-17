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

export const gameEngineEnv = {
  port: readNumberEnv('GAME_ENGINE_PORT', readNumberEnv('PORT', 4102)),
  jwtSecret: readRequiredEnv('JWT_SECRET', 'gitgud-dev-secret'),
  groqApiKey: process.env.GROQ_API_KEY ?? '',
};
