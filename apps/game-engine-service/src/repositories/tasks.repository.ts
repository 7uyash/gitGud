import { eq } from 'drizzle-orm';

import { db, tasks } from '@gitgud/database';

type TaskRow = typeof tasks.$inferSelect;

export interface TaskTemplate {
  title: string;
  description: string;
  difficulty: string;
  isSabotage: boolean;
  expectedSolution: string;
}

export class TasksRepository {
  async createTasks(matchId: string, templates: TaskTemplate[]): Promise<TaskRow[]> {
    if (templates.length === 0) {
      return [];
    }

    return db
      .insert(tasks)
      .values(
        templates.map((template) => ({
          matchId,
          title: template.title,
          description: template.description,
          difficulty: template.difficulty,
          isSabotage: template.isSabotage,
          expectedSolution: template.expectedSolution,
        })),
      )
      .returning();
  }

  async listTasks(matchId: string): Promise<TaskRow[]> {
    return db.select().from(tasks).where(eq(tasks.matchId, matchId));
  }

  async markTaskComplete(taskId: string): Promise<TaskRow | null> {
    const [record] = await db.update(tasks).set({ status: 'done' }).where(eq(tasks.id, taskId)).returning();
    return record ?? null;
  }

  async getTask(taskId: string): Promise<TaskRow | null> {
    const [record] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    return record ?? null;
  }
}
