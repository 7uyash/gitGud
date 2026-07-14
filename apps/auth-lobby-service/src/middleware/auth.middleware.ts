import type { NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth.service';

function readBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.');
  }

  return authorizationHeader.slice('Bearer '.length);
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const token = readBearerToken(request.headers.authorization);
    request.auth = authService.verifyToken(token);
    return next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return response.status(401).json({ message });
  }
}