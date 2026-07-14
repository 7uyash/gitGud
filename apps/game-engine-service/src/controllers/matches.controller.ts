import type { Request, Response } from 'express';

import { matchesService } from '../services/matches.service';
import type { MatchInitializationPayload, TaskSubmissionPayload } from '../contracts';
import { broadcastMatchStarted, broadcastSubmissionReviewed } from '../sockets';

export class MatchesController {
  private readRouteParam(value: string | string[] | undefined): string {
    if (typeof value !== 'string') {
      throw new Error('Missing route parameter.');
    }

    return value;
  }

  async getMatch(request: Request, response: Response) {
    try {
      const payload = await matchesService.getMatch(this.readRouteParam(request.params.matchId));
      return response.status(200).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load match.';
      return response.status(400).json({ message });
    }
  }

  async startMatch(request: Request, response: Response) {
    try {
      const { lobbyId, playerIds, timerSeconds } = request.body as MatchInitializationPayload;

      if (!lobbyId || !playerIds || playerIds.length === 0) {
        return response.status(400).json({ message: 'lobbyId and playerIds are required.' });
      }

      const payload = await matchesService.initializeMatch({
        lobbyId,
        playerIds,
        timerSeconds: timerSeconds ?? 900,
      });

      if (payload.match) {
        broadcastMatchStarted(payload.match.id, payload);
      }

      return response.status(201).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize match.';
      return response.status(400).json({ message });
    }
  }

  async submitTask(request: Request, response: Response) {
    try {
      const claims = request.auth;
      if (!claims) {
        return response.status(401).json({ message: 'Unauthorized' });
      }

      const { taskText } = request.body as TaskSubmissionPayload;

      if (!taskText) {
        return response.status(400).json({ message: 'taskText is required.' });
      }

      const payload = await matchesService.reviewTaskSubmission({
        matchId: this.readRouteParam(request.params.matchId),
        userId: claims.userId,
        taskText,
      });

      broadcastSubmissionReviewed(payload);

      return response.status(201).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit task.';
      return response.status(400).json({ message });
    }
  }

  async getRecap(request: Request, response: Response) {
    try {
      const payload = await matchesService.getRecap(this.readRouteParam(request.params.matchId));
      return response.status(200).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load recap.';
      return response.status(400).json({ message });
    }
  }
}

export const matchesController = new MatchesController();
