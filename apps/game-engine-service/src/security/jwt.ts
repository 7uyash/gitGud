import jwt from 'jsonwebtoken';

import { gameEngineEnv } from '../config/env';
import type { JwtClaims } from '@gitgud/shared';

export function readBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.');
  }

  return authorizationHeader.slice('Bearer '.length);
}

export function verifyGameToken(token: string): JwtClaims {
  return jwt.verify(token, gameEngineEnv.jwtSecret) as JwtClaims;
}
