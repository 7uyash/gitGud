import { eq } from 'drizzle-orm';

import { db, lobbyPlayers, lobbies } from '@gitgud/database';

export class LobbiesRepository {
  async findLobbyById(lobbyId: string) {
    const [record] = await db.select().from(lobbies).where(eq(lobbies.id, lobbyId)).limit(1);
    return record ?? null;
  }

  async listLobbyPlayers(lobbyId: string) {
    return db.select().from(lobbyPlayers).where(eq(lobbyPlayers.lobbyId, lobbyId));
  }
}
