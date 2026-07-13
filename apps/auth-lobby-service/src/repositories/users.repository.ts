import { eq } from 'drizzle-orm';

import { db, users } from '@gitgud/database';
import type { GitHubProfile } from '@gitgud/shared';

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

  async findByGitHubId(githubId: string) {
    const [record] = await db.select().from(users).where(eq(users.githubId, githubId)).limit(1);
    return record ?? null;
  }
}
