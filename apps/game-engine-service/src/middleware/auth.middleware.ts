import type { NextFunction, Request, Response } from 'express';

import { verifyGameToken } from '../security/jwt';

function readBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.');
  }

  return authorizationHeader.slice('Bearer '.length);
}

export function requireGameAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const token = readBearerToken(request.headers.authorization);
    request.auth = verifyGameToken(token);
    return next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return response.status(401).json({ message });
  }
}