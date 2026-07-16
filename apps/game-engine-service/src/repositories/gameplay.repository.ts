import { and, eq, sql } from 'drizzle-orm';

import { db, commits, meetings, votes } from '@gitgud/database';

export class GameplayRepository {
  async createCommit(matchId: string, userId: string, commitHash: string, message: string, diffText: string) {
    const [record] = await db
      .insert(commits)
      .values({
        matchId,
        userId,
        commitHash,
        message,
        diffText,
      })
      .returning();

    return record;
  }

  async listCommits(matchId: string) {
    return db.select().from(commits).where(eq(commits.matchId, matchId)).orderBy(commits.createdAt);
  }

  async updateCommitReview(commitId: string, reviewStatus: 'pending' | 'approved' | 'rejected') {
    const [record] = await db.update(commits).set({ reviewStatus }).where(eq(commits.id, commitId)).returning();
    return record ?? null;
  }

  async createMeeting(matchId: string, triggeredByUserId: string, reason: string) {
    const [record] = await db
      .insert(meetings)
      .values({
        matchId,
        triggeredByUserId,
        reason,
      })
      .returning();

    return record;
  }

  async createVote(matchId: string, meetingId: string, voterUserId: string, targetUserId: string | null) {
    const [record] = await db
      .insert(votes)
      .values({
        matchId,
        meetingId,
        voterUserId,
        targetUserId,
      })
      .returning();

    return record;
  }

  async countVotesForTarget(meetingId: string, targetUserId: string | null) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(and(eq(votes.meetingId, meetingId), targetUserId === null ? sql`"target_user_id" is null` : eq(votes.targetUserId, targetUserId)));

    return Number(result[0]?.count ?? 0);
  }

  async countVotesForMeeting(meetingId: string) {
    const result = await db.select({ count: sql<number>`count(*)` }).from(votes).where(eq(votes.meetingId, meetingId));
    return Number(result[0]?.count ?? 0);
  }
}
