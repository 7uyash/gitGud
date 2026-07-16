import type { Request, Response } from 'express';

import { lobbiesService } from '../services/lobbies.service';
import type { LobbySnapshotResponse } from '../contracts';

function readRouteParam(value: string | string[] | undefined): string {
  if (typeof value !== 'string') {
    throw new Error('Missing route parameter.');
  }

  return value;
}

export class LobbiesController {
  async listPublicLobbies(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const lobbies = await lobbiesService.listPublicLobbies();
      return response.status(200).json(lobbies);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list lobbies.';
      return response.status(400).json({ message });
    }
  }
  async createLobby(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const { maxPlayers } = request.body as { maxPlayers?: number };
      const lobby = await lobbiesService.createLobby(claims.userId, maxPlayers ?? 8);
      return response.status(201).json(lobby);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create lobby.';
      return response.status(400).json({ message });
    }
  }

  async joinLobby(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const lobby = await lobbiesService.joinLobby(readRouteParam(request.params.lobbyId), claims.userId);
      return response.status(200).json(lobby);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join lobby.';
      return response.status(400).json({ message });
    }
  }

  async leaveLobby(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const lobby = await lobbiesService.leaveLobby(readRouteParam(request.params.lobbyId), claims.userId);
      return response.status(200).json(lobby);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to leave lobby.';
      return response.status(400).json({ message });
    }
  }

  async setReady(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const { isReady } = request.body as { isReady?: boolean };
      const lobby = await lobbiesService.setReady(readRouteParam(request.params.lobbyId), claims.userId, Boolean(isReady));
      return response.status(200).json(lobby);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update ready status.';
      return response.status(400).json({ message });
    }
  }

  async startLobby(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const startPayload = await lobbiesService.startLobby(readRouteParam(request.params.lobbyId), claims.userId);
      return response.status(200).json(startPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start lobby.';
      return response.status(400).json({ message });
    }
  }

  async joinLobbyByCode(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const lobby = await lobbiesService.joinLobbyByCode(readRouteParam(request.params.code), claims.userId);
      return response.status(200).json(lobby);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join lobby by code.';
      return response.status(400).json({ message });
    }
  }

  async getLobby(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const lobby = await lobbiesService.getLobby(readRouteParam(request.params.lobbyId));
      const payload: LobbySnapshotResponse = lobby;
      return response.status(200).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load lobby.';
      return response.status(400).json({ message });
    }
  }
}

export const lobbiesController = new LobbiesController();
