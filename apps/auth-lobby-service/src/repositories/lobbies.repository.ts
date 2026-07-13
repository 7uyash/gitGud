import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

import { db, lobbyPlayers, lobbies } from '@gitgud/database';

type LobbyPlayerRow = typeof lobbyPlayers.$inferSelect;
type LobbyRow = typeof lobbies.$inferSelect;

function generateJoinCode(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

export class LobbiesRepository {
  async createLobby(hostUserId: string, maxPlayers: number) {
    const [lobby] = await db
      .insert(lobbies)
      .values({
        hostUserId,
        maxPlayers,
        joinCode: generateJoinCode(),
      })
      .returning();

    const [hostPlayer] = await db
      .insert(lobbyPlayers)
      .values({
        lobbyId: lobby.id,
        userId: hostUserId,
        isReady: false,
      })
      .returning();

    return { lobby, hostPlayer };
  }

  async findLobbyById(lobbyId: string) {
    const [record] = await db.select().from(lobbies).where(eq(lobbies.id, lobbyId)).limit(1);
    return record ?? null;
  }

  async findLobbyByJoinCode(joinCode: string) {
    const [record] = await db.select().from(lobbies).where(eq(lobbies.joinCode, joinCode)).limit(1);
    return record ?? null;
  }

  async listLobbyPlayers(lobbyId: string): Promise<LobbyPlayerRow[]> {
    return db.select().from(lobbyPlayers).where(eq(lobbyPlayers.lobbyId, lobbyId));
  }

  async addPlayer(lobbyId: string, userId: string): Promise<LobbyPlayerRow | null> {
    const [record] = await db
      .insert(lobbyPlayers)
      .values({
        lobbyId,
        userId,
        isReady: false,
      })
      .onConflictDoNothing({ target: [lobbyPlayers.lobbyId, lobbyPlayers.userId] })
      .returning();

    return record ?? null;
  }

  async removePlayer(lobbyId: string, userId: string): Promise<LobbyPlayerRow | null> {
    const [record] = await db
      .delete(lobbyPlayers)
      .where(and(eq(lobbyPlayers.lobbyId, lobbyId), eq(lobbyPlayers.userId, userId)))
      .returning();

    return record ?? null;
  }

  async setReady(lobbyId: string, userId: string, isReady: boolean): Promise<LobbyPlayerRow | null> {
    const [record] = await db
      .update(lobbyPlayers)
      .set({ isReady })
      .where(and(eq(lobbyPlayers.lobbyId, lobbyId), eq(lobbyPlayers.userId, userId)))
      .returning();

    return record ?? null;
  }

  async markStarting(lobbyId: string): Promise<LobbyRow | null> {
    const [record] = await db.update(lobbies).set({ status: 'starting' }).where(eq(lobbies.id, lobbyId)).returning();
    return record ?? null;
  }
}
