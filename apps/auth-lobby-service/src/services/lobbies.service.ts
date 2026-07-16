import type { LobbyPlayerSnapshot, LobbySnapshotResponse, LobbyStartPayload } from '../contracts';
import { LobbiesRepository } from '../repositories/lobbies.repository';
import { UsersRepository } from '../repositories/users.repository';

export class LobbiesService {
  private readonly lobbiesRepository = new LobbiesRepository();
  private readonly usersRepository = new UsersRepository();

  async createLobby(hostUserId: string, maxPlayers = 8) {
    return this.lobbiesRepository.createLobby(hostUserId, maxPlayers);
  }

  async joinLobby(lobbyId: string, userId: string) {
    const lobby = await this.lobbiesRepository.findLobbyById(lobbyId);
    if (!lobby) {
      throw new Error('Lobby not found.');
    }

    if (lobby.status !== 'open') {
      throw new Error('Lobby is not open for joining.');
    }

    const players = await this.lobbiesRepository.listLobbyPlayers(lobbyId);
    if (players.length >= lobby.maxPlayers) {
      throw new Error('Lobby is full.');
    }

    await this.lobbiesRepository.addPlayer(lobbyId, userId);
    return this.getLobbySnapshot(lobbyId);
  }

  async leaveLobby(lobbyId: string, userId: string) {
    await this.lobbiesRepository.removePlayer(lobbyId, userId);
    return this.getLobbySnapshot(lobbyId);
  }

  async setReady(lobbyId: string, userId: string, isReady: boolean) {
    await this.lobbiesRepository.setReady(lobbyId, userId, isReady);
    return this.getLobbySnapshot(lobbyId);
  }

  async getLobby(lobbyId: string): Promise<LobbySnapshotResponse> {
    return this.getLobbySnapshot(lobbyId);
  }

  async joinLobbyByCode(joinCode: string, userId: string): Promise<LobbySnapshotResponse> {
    const lobby = await this.lobbiesRepository.findLobbyByJoinCode(joinCode.toUpperCase());
    if (!lobby) {
      throw new Error('Lobby not found for that room code.');
    }
    return this.joinLobby(lobby.id, userId);
  }

  async listPublicLobbies() {
    const lobbies = await this.lobbiesRepository.listPublicLobbies();
    return Promise.all(
      lobbies.map(async (l) => {
        const players = await this.lobbiesRepository.listLobbyPlayers(l.id);
        return {
          id: l.id,
          maxPlayers: l.maxPlayers,
          joinCode: l.joinCode,
          status: l.status,
          playerCount: players.length,
          createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt),
        };
      }),
    );
  }

  async startLobby(lobbyId: string, hostUserId: string): Promise<LobbyStartPayload> {
    const lobby = await this.lobbiesRepository.findLobbyById(lobbyId);
    if (!lobby) {
      throw new Error('Lobby not found.');
    }

    if (lobby.hostUserId !== hostUserId) {
      throw new Error('Only the host can start the lobby.');
    }

    const players = await this.lobbiesRepository.listLobbyPlayers(lobbyId);
    if (players.length < 1) {
      throw new Error('At least two players are required to start a match.');
    }

    if (players.some((player) => !player.isReady)) {
      throw new Error('All players must be ready before starting the match.');
    }

    await this.lobbiesRepository.markStarting(lobbyId);

    return {
      lobbyId,
      hostUserId,
      playerIds: players.map((player) => player.userId),
      timerSeconds: 900,
    };
  }

  private async getLobbySnapshot(lobbyId: string): Promise<LobbySnapshotResponse> {
    const lobby = await this.lobbiesRepository.findLobbyById(lobbyId);
    if (!lobby) {
      throw new Error('Lobby not found.');
    }

    const players = await this.lobbiesRepository.listLobbyPlayers(lobbyId);
    const playerSnapshots: LobbyPlayerSnapshot[] = await Promise.all(
      players.map(async (player) => {
        const user = await this.usersRepository.findById(player.userId);
        return {
          userId: player.userId,
          username: user?.username ?? player.userId,
          avatarUrl: user?.avatarUrl ?? '',
          displayName: user?.displayName ?? player.userId,
          isReady: player.isReady,
        };
      }),
    );

    return {
      lobby,
      players: playerSnapshots,
    };
  }
}

export const lobbiesService = new LobbiesService();
