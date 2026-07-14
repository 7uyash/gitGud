import type { Request, Response } from 'express';

import { authService } from '../services/auth.service';
import { UsersRepository } from '../repositories/users.repository';
import type { CurrentUserResponse } from '../contracts';

const usersRepository = new UsersRepository();

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
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const user = await usersRepository.findById(claims.userId);

      if (!user) {
        return response.status(404).json({ message: 'User not found.' });
      }

      const payload: CurrentUserResponse = { user, claims };
      return response.status(200).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized';
      return response.status(401).json({ message });
    }
  }
}

export const authController = new AuthController();
