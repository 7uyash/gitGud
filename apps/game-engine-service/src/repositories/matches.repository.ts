import { and, eq } from 'drizzle-orm';

import { db, matchResults, matches, playerTasks, tasks } from '@gitgud/database';

type MatchRow = typeof matches.$inferSelect;
type PlayerTaskRow = typeof playerTasks.$inferSelect;
type MatchResultRow = typeof matchResults.$inferSelect;

export class MatchesRepository {
  async createMatch(lobbyId: string, roleAssignments: Record<string, string>, timerSeconds: number): Promise<MatchRow> {
    const [record] = await db
      .insert(matches)
      .values({
        lobbyId,
        roleAssignments,
        timerSecondsRemaining: timerSeconds,
        status: 'active',
      })
      .returning();

    return record;
  }

  async getMatch(matchId: string): Promise<MatchRow | null> {
    const [record] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    return record ?? null;
  }

  async updateMatch(matchId: string, patch: Partial<typeof matches.$inferInsert>): Promise<MatchRow | null> {
    const [record] = await db.update(matches).set(patch).where(eq(matches.id, matchId)).returning();
    return record ?? null;
  }

  async createPlayerTaskAssignments(assignments: Array<{ matchId: string; taskId: string; userId: string }>): Promise<PlayerTaskRow[]> {
    if (assignments.length === 0) {
      return [];
    }

    return db.insert(playerTasks).values(assignments).returning();
  }

  async completeAssignedTaskForUser(matchId: string, userId: string): Promise<PlayerTaskRow | null> {
    const [assignment] = await db
      .select()
      .from(playerTasks)
      .where(and(eq(playerTasks.matchId, matchId), eq(playerTasks.userId, userId)))
      .limit(1);

    if (!assignment || assignment.completedAt) {
      return null;
    }

    await db.update(playerTasks).set({ completedAt: new Date() }).where(eq(playerTasks.id, assignment.id));
    await db.update(tasks).set({ status: 'done' }).where(eq(tasks.id, assignment.taskId));

    return assignment;
  }

  async getAssignedTaskForUser(matchId: string, userId: string): Promise<PlayerTaskRow | null> {
    const [assignment] = await db
      .select()
      .from(playerTasks)
      .where(and(eq(playerTasks.matchId, matchId), eq(playerTasks.userId, userId)))
      .limit(1);
    return assignment ?? null;
  }

  async countCompletedTasks(matchId: string): Promise<number> {
    const completedTasks = await db
      .select()
      .from(playerTasks)
      .where(eq(playerTasks.matchId, matchId));

    return completedTasks.filter((task: PlayerTaskRow) => Boolean(task.completedAt)).length;
  }

  async countTotalTasks(matchId: string): Promise<number> {
    const totalTasks = await db.select().from(tasks).where(eq(tasks.matchId, matchId));
    return totalTasks.length;
  }

  async createMatchResult(matchId: string, payload: { winnerTeam: string; endingReason: string; summary: string; learningRecap: string }): Promise<MatchResultRow> {
    const existingResult = await this.getMatchResult(matchId);
    if (existingResult) {
      return existingResult;
    }

    const [record] = await db
      .insert(matchResults)
      .values({
        matchId,
        winnerTeam: payload.winnerTeam,
        endingReason: payload.endingReason,
        summary: payload.summary,
        learningRecap: payload.learningRecap,
      })
      .returning();

    await this.updateMatch(matchId, { status: 'finished', endedAt: new Date() });
    return record;
  }

  async getMatchResult(matchId: string): Promise<MatchResultRow | null> {
    const [record] = await db.select().from(matchResults).where(eq(matchResults.matchId, matchId)).limit(1);
    return record ?? null;
  }
}
