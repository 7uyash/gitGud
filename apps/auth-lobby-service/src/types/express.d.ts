import type { JwtClaims } from '../contracts';

declare global {
  namespace Express {
    interface Request {
      auth?: JwtClaims;
    }
  }
}

export {};