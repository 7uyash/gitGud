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
  const rawValue = process.env[name] ?? fallback;
  if (!rawValue) {
    throw new Error(`${name} is required.`);
  }

  return rawValue;
}

export const gameEngineEnv = {
  port: readNumberEnv('GAME_ENGINE_PORT', readNumberEnv('PORT', 4102)),
  jwtSecret: readRequiredEnv('JWT_SECRET', 'gitgud-dev-secret'),
};
