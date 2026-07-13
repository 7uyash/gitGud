import type { LobbyPlayerSnapshot } from '@gitgud/shared';

import { LobbiesRepository } from '../repositories/lobbies.repository';

export interface LobbyStartPayload {
  lobbyId: string;
  hostUserId: string;
  playerIds: string[];
  timerSeconds: number;
}

export class LobbiesService {
  private readonly lobbiesRepository = new LobbiesRepository();

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

  async startLobby(lobbyId: string, hostUserId: string): Promise<LobbyStartPayload> {
    const lobby = await this.lobbiesRepository.findLobbyById(lobbyId);
    if (!lobby) {
      throw new Error('Lobby not found.');
    }

    if (lobby.hostUserId !== hostUserId) {
      throw new Error('Only the host can start the lobby.');
    }

    const players = await this.lobbiesRepository.listLobbyPlayers(lobbyId);
    if (players.length < 2) {
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

  private async getLobbySnapshot(lobbyId: string) {
    const lobby = await this.lobbiesRepository.findLobbyById(lobbyId);
    if (!lobby) {
      throw new Error('Lobby not found.');
    }

    const players = await this.lobbiesRepository.listLobbyPlayers(lobbyId);
    const playerSnapshots: LobbyPlayerSnapshot[] = players.map((player) => ({
      userId: player.userId,
      username: player.userId,
      avatarUrl: '',
      displayName: player.userId,
      isReady: player.isReady,
    }));

    return {
      lobby,
      players: playerSnapshots,
    };
  }
}

export const lobbiesService = new LobbiesService();
