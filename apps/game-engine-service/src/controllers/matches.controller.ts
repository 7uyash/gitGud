import type { Request, Response } from 'express';

import { matchesService } from '../services/matches.service';

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

  async initializeMatch(request: Request, response: Response) {
    try {
      const { lobbyId, playerIds, timerSeconds } = request.body as {
        lobbyId?: string;
        playerIds?: string[];
        timerSeconds?: number;
      };

      if (!lobbyId || !playerIds || playerIds.length === 0) {
        return response.status(400).json({ message: 'lobbyId and playerIds are required.' });
      }

      const payload = await matchesService.initializeMatch({
        matchId: this.readRouteParam(request.params.matchId),
        lobbyId,
        players: playerIds.map((userId) => ({ userId, role: 'crew' })),
        timerSeconds: timerSeconds ?? 900,
      });

      return response.status(201).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize match.';
      return response.status(400).json({ message });
    }
  }

  async submitCommit(request: Request, response: Response) {
    try {
      const { userId, commitHash, message, diffText } = request.body as {
        userId?: string;
        commitHash?: string;
        message?: string;
        diffText?: string;
      };

      if (!userId || !commitHash || !message || !diffText) {
        return response.status(400).json({ message: 'userId, commitHash, message, and diffText are required.' });
      }

      const payload = await matchesService.submitCommit({
        matchId: this.readRouteParam(request.params.matchId),
        userId,
        commitHash,
        message,
        diffText,
      });

      return response.status(201).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit commit.';
      return response.status(400).json({ message });
    }
  }

  async reviewCommit(request: Request, response: Response) {
    try {
      const { commitId, reviewerUserId, reviewStatus, notes } = request.body as {
        commitId?: string;
        reviewerUserId?: string;
        reviewStatus?: 'pending' | 'approved' | 'rejected';
        notes?: string;
      };

      if (!commitId || !reviewerUserId || !reviewStatus) {
        return response.status(400).json({ message: 'commitId, reviewerUserId, and reviewStatus are required.' });
      }

      const payload = await matchesService.reviewCommit({
        matchId: this.readRouteParam(request.params.matchId),
        commitId,
        reviewerUserId,
        reviewStatus,
        notes,
      });

      return response.status(200).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to review commit.';
      return response.status(400).json({ message });
    }
  }

  async startMeeting(request: Request, response: Response) {
    try {
      const { triggeredByUserId, reason } = request.body as { triggeredByUserId?: string; reason?: string };
      if (!triggeredByUserId || !reason) {
        return response.status(400).json({ message: 'triggeredByUserId and reason are required.' });
      }

      const payload = await matchesService.startMeeting({
        matchId: this.readRouteParam(request.params.matchId),
        triggeredByUserId,
        reason,
      });

      return response.status(201).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start meeting.';
      return response.status(400).json({ message });
    }
  }

  async castVote(request: Request, response: Response) {
    try {
      const { meetingId, voterUserId, targetUserId } = request.body as {
        meetingId?: string;
        voterUserId?: string;
        targetUserId?: string | null;
      };

      if (!meetingId || !voterUserId) {
        return response.status(400).json({ message: 'meetingId and voterUserId are required.' });
      }

      const payload = await matchesService.castVote({
        matchId: this.readRouteParam(request.params.matchId),
        meetingId,
        voterUserId,
        targetUserId: targetUserId ?? null,
      });

      return response.status(201).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cast vote.';
      return response.status(400).json({ message });
    }
  }

  async startTimer(request: Request, response: Response) {
    try {
      const { timerSeconds } = request.body as { timerSeconds?: number };
      const payload = await matchesService.startTimer(this.readRouteParam(request.params.matchId), timerSeconds ?? 900);
      return response.status(200).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start timer.';
      return response.status(400).json({ message });
    }
  }

  async tickTimer(request: Request, response: Response) {
    try {
      const { seconds } = request.body as { seconds?: number };
      const payload = await matchesService.tickTimer(this.readRouteParam(request.params.matchId), seconds ?? 1);
      return response.status(200).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to tick timer.';
      return response.status(400).json({ message });
    }
  }

  async finishMatch(request: Request, response: Response) {
    try {
      const { winnerTeam, endingReason, summary, learningRecap } = request.body as {
        winnerTeam?: string;
        endingReason?: string;
        summary?: string;
        learningRecap?: string;
      };

      if (!winnerTeam || !endingReason || !summary || !learningRecap) {
        return response.status(400).json({ message: 'winnerTeam, endingReason, summary, and learningRecap are required.' });
      }

      const payload = await matchesService.finishMatch(this.readRouteParam(request.params.matchId), {
        winnerTeam,
        endingReason,
        summary,
        learningRecap,
      });

      return response.status(201).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to finish match.';
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
