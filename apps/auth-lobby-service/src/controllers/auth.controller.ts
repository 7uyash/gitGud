import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { sign } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db, users } from '@gitgud/database';

import { authLobbyEnv } from '../config/env';
import { authService } from '../services/auth.service';
import { emailService } from '../services/email.service';
import { UsersRepository } from '../repositories/users.repository';
import type { CurrentUserResponse } from '../contracts';

const usersRepository = new UsersRepository();

export class AuthController {
  githubStart(_request: Request, response: Response) {
    const state = randomUUID();
    return response.redirect(authService.buildGithubAuthorizeUrl(state));
  }

  async githubCallback(request: Request, response: Response) {
    const code = typeof request.query.code === 'string' ? request.query.code : null;
    const error = typeof request.query.error === 'string' ? request.query.error : null;

    if (error) {
      const errorDesc = typeof request.query.error_description === 'string' ? request.query.error_description : error;
      console.error('[OAuth] GitHub returned error:', error, errorDesc);
      const redirectUrl = new URL('/login', authLobbyEnv.frontendUrl);
      redirectUrl.searchParams.set('error', errorDesc);
      return response.redirect(redirectUrl.toString());
    }

    if (!code) {
      return response.status(400).send('Missing GitHub OAuth code.');
    }

    try {
      const session = await authService.exchangeGithubCode(code);
      const redirectUrl = new URL('/auth/callback', authLobbyEnv.frontendUrl);
      redirectUrl.searchParams.set('token', session.token);
      redirectUrl.searchParams.set('userId', session.userId);

      return response.redirect(redirectUrl.toString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GitHub authentication failed.';
      console.error('[OAuth] Authentication failed:', message);
      const redirectUrl = new URL('/login', authLobbyEnv.frontendUrl);
      redirectUrl.searchParams.set('error', message);
      return response.redirect(redirectUrl.toString());
    }
  }

  googleStart(_request: Request, response: Response) {
    const state = randomUUID();
    return response.redirect(authService.buildGoogleAuthorizeUrl(state));
  }

  async googleCallback(request: Request, response: Response) {
    const code = typeof request.query.code === 'string' ? request.query.code : null;
    const error = typeof request.query.error === 'string' ? request.query.error : null;

    if (error) {
      console.error('[OAuth] Google returned error:', error);
      const redirectUrl = new URL('/login', authLobbyEnv.frontendUrl);
      redirectUrl.searchParams.set('error', error);
      return response.redirect(redirectUrl.toString());
    }

    if (!code) {
      return response.status(400).send('Missing Google OAuth code.');
    }

    try {
      const session = await authService.exchangeGoogleCode(code);
      const redirectUrl = new URL('/auth/callback', authLobbyEnv.frontendUrl);
      redirectUrl.searchParams.set('token', session.token);
      redirectUrl.searchParams.set('userId', session.userId);

      return response.redirect(redirectUrl.toString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google authentication failed.';
      console.error('[OAuth] Authentication failed:', message);
      const redirectUrl = new URL('/login', authLobbyEnv.frontendUrl);
      redirectUrl.searchParams.set('error', message);
      return response.redirect(redirectUrl.toString());
    }
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
  async myMatches(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const matches = await usersRepository.listRecentMatches(claims.userId);
      return response.status(200).json(matches);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list matches.';
      return response.status(400).json({ message });
    }
  }

  async devLogin(request: Request, response: Response) {
    try {
      const { username } = request.body;
      if (!username) return response.status(400).json({ message: 'Username is required' });

      let [user] = await db.select().from(users).where(eq(users.username, username));
      if (!user) {
        const dummyGithubId = `dev-${Date.now()}`;
        [user] = await db
          .insert(users)
          .values({
            githubId: dummyGithubId,
            username: username,
            displayName: `${username} (Dev)`,
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          })
          .returning();
      }

      const token = sign(
        { userId: user.id, username: user.username },
        authLobbyEnv.jwtSecret,
        { expiresIn: '12h' },
      );

      return response.status(200).json({ token });
    } catch (error) {
      return response.status(400).json({ message: 'Dev login failed' });
    }
  }
}

export const authController = new AuthController();
