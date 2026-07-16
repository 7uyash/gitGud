import { and, desc, eq } from 'drizzle-orm';

import { db, lobbyPlayers, matchResults, matches, users } from '@gitgud/database';
import type { GitHubProfile } from '../contracts';

export class UsersRepository {
  async upsertGitHubUser(profile: GitHubProfile) {
    const [record] = await db
      .insert(users)
      .values({
        githubId: profile.githubId,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        displayName: profile.displayName,
      })
      .onConflictDoUpdate({
        target: users.githubId,
        set: {
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          displayName: profile.displayName,
        },
      })
      .returning();

    return record;
  }

  async findById(userId: string) {
    const [record] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return record ?? null;
  }

  async listRecentMatches(userId: string) {
    return db
      .select({
        id: matches.id,
        status: matches.status,
        startedAt: matches.startedAt,
        roleAssignments: matches.roleAssignments,
        winnerTeam: matchResults.winnerTeam,
        endingReason: matchResults.endingReason,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .innerJoin(lobbyPlayers, and(eq(lobbyPlayers.lobbyId, matches.lobbyId), eq(lobbyPlayers.userId, userId)))
      .leftJoin(matchResults, eq(matchResults.matchId, matches.id))
      .orderBy(desc(matches.createdAt))
      .limit(10);
  }

  async findByGitHubId(githubId: string) {
    const [record] = await db.select().from(users).where(eq(users.githubId, githubId)).limit(1);
    return record ?? null;
  }
}
