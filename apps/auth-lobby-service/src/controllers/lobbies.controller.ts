import type { Request, Response } from 'express';

import { authService } from '../services/auth.service';
import { lobbiesService } from '../services/lobbies.service';

function readBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.');
  }

  return authorizationHeader.slice('Bearer '.length);
}

function readRouteParam(value: string | string[] | undefined): string {
  if (typeof value !== 'string') {
    throw new Error('Missing route parameter.');
  }

  return value;
}

export class LobbiesController {
  async createLobby(request: Request, response: Response) {
    try {
      const token = readBearerToken(request.headers.authorization);
      const claims = authService.verifyToken(token);
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
      const token = readBearerToken(request.headers.authorization);
      const claims = authService.verifyToken(token);
      const lobby = await lobbiesService.joinLobby(readRouteParam(request.params.lobbyId), claims.userId);
      return response.status(200).json(lobby);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join lobby.';
      return response.status(400).json({ message });
    }
  }

  async leaveLobby(request: Request, response: Response) {
    try {
      const token = readBearerToken(request.headers.authorization);
      const claims = authService.verifyToken(token);
      const lobby = await lobbiesService.leaveLobby(readRouteParam(request.params.lobbyId), claims.userId);
      return response.status(200).json(lobby);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to leave lobby.';
      return response.status(400).json({ message });
    }
  }

  async setReady(request: Request, response: Response) {
    try {
      const token = readBearerToken(request.headers.authorization);
      const claims = authService.verifyToken(token);
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
      const token = readBearerToken(request.headers.authorization);
      const claims = authService.verifyToken(token);
      const startPayload = await lobbiesService.startLobby(readRouteParam(request.params.lobbyId), claims.userId);
      return response.status(200).json(startPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start lobby.';
      return response.status(400).json({ message });
    }
  }
}

export const lobbiesController = new LobbiesController();
