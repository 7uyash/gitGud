import jwt from 'jsonwebtoken';

import { authLobbyEnv } from '../config/env';
import { UsersRepository } from '../repositories/users.repository';
import type { AuthSession, GitHubProfile, JwtClaims } from '../contracts';

export class AuthService {
  private readonly usersRepository = new UsersRepository();

  async authenticateGitHubUser(profile: GitHubProfile): Promise<AuthSession> {
    const user = await this.usersRepository.upsertGitHubUser(profile);
    const token = this.issueToken({ userId: user.id, username: user.username });

    return {
      userId: user.id,
      token,
    };
  }

  issueToken(claims: JwtClaims): string {
    return jwt.sign(claims, authLobbyEnv.jwtSecret, { expiresIn: '12h' });
  }

  verifyToken(token: string): JwtClaims {
    return jwt.verify(token, authLobbyEnv.jwtSecret) as JwtClaims;
  }
}

export const authService = new AuthService();
