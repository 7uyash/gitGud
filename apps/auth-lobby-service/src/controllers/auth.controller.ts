import type { Request, Response } from 'express';

import { authService } from '../services/auth.service';
import { UsersRepository } from '../repositories/users.repository';

const usersRepository = new UsersRepository();

function readBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.');
  }

  return authorizationHeader.slice('Bearer '.length);
}

export class AuthController {
  async githubLogin(request: Request, response: Response) {
    const { githubId, username, avatarUrl, displayName } = request.body as {
      githubId?: string;
      username?: string;
      avatarUrl?: string;
      displayName?: string;
    };

    if (!githubId || !username || !avatarUrl || !displayName) {
      return response.status(400).json({ message: 'githubId, username, avatarUrl, and displayName are required.' });
    }

    const session = await authService.authenticateGitHubUser({
      githubId,
      username,
      avatarUrl,
      displayName,
    });

    return response.status(200).json(session);
  }

  async me(request: Request, response: Response) {
    try {
      const token = readBearerToken(request.headers.authorization);
      const claims = authService.verifyToken(token);
      const user = await usersRepository.findById(claims.userId);

      if (!user) {
        return response.status(404).json({ message: 'User not found.' });
      }

      return response.status(200).json({ user, claims });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized';
      return response.status(401).json({ message });
    }
  }
}

export const authController = new AuthController();
