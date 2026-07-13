import type { CommitReviewPayload, CommitSubmitPayload, GameRole, MatchInitializationPayload, MeetingStartPayload, VoteCastPayload } from '@gitgud/shared';

import { GameplayRepository } from '../repositories/gameplay.repository';
import { LobbiesRepository } from '../repositories/lobbies.repository';
import { MatchesRepository } from '../repositories/matches.repository';
import { TasksRepository, type TaskTemplate } from '../repositories/tasks.repository';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export class MatchesService {
  private readonly lobbiesRepository = new LobbiesRepository();
  private readonly matchesRepository = new MatchesRepository();
  private readonly tasksRepository = new TasksRepository();
  private readonly gameplayRepository = new GameplayRepository();

  async initializeMatch(payload: MatchInitializationPayload) {
    const lobby = await this.lobbiesRepository.findLobbyById(payload.lobbyId);
    if (!lobby) {
      throw new Error('Lobby not found.');
    }

    const roleAssignments = this.assignRoles(payload.players.map((player) => player.userId));
    const match = await this.matchesRepository.createMatch(payload.lobbyId, roleAssignments, payload.timerSeconds);
    const taskTemplates = this.buildTaskTemplates();
    const createdTasks = await this.tasksRepository.createTasks(match.id, taskTemplates);

    const assignments = createdTasks.flatMap((task: (typeof createdTasks)[number], index: number) => {
      const userId = payload.players[index % payload.players.length]?.userId;
      return userId ? [{ matchId: match.id, taskId: task.id, userId }] : [];
    });

    await this.matchesRepository.createPlayerTaskAssignments(assignments);

    return {
      match,
      roleAssignments,
      tasks: createdTasks,
    };
  }

  async getMatch(matchId: string) {
    const match = await this.matchesRepository.getMatch(matchId);
    const result = await this.matchesRepository.getMatchResult(matchId);
    const tasks = await this.tasksRepository.listTasks(matchId);

    return {
      match,
      result,
      tasks,
    };
  }

  async submitCommit(payload: CommitSubmitPayload) {
    const commit = await this.gameplayRepository.createCommit(payload.matchId, payload.userId, payload.commitHash, payload.message, payload.diffText);
    return {
      commit,
    };
  }

  async reviewCommit(payload: CommitReviewPayload) {
    const updatedCommit = await this.gameplayRepository.updateCommitReview(payload.commitId, payload.reviewStatus);
    if (!updatedCommit) {
      throw new Error('Commit not found.');
    }

    if (payload.reviewStatus === 'approved') {
      await this.matchesRepository.completeAssignedTaskForUser(payload.matchId, updatedCommit.userId);
      const shipReadiness = await this.calculateShipReadiness(payload.matchId);
      const updatedMatch = await this.matchesRepository.updateMatch(payload.matchId, { shipReadiness });

      if (shipReadiness >= 100 && updatedMatch) {
        await this.finishMatch(payload.matchId, {
          winnerTeam: 'crew',
          endingReason: 'All tasks completed and the ship is ready.',
          summary: 'The crew shipped the codebase successfully.',
          learningRecap: this.buildLearningRecap('crew', 'All tasks were completed through code review and debugging.'),
        });
      }
    }

    return {
      commit: updatedCommit,
    };
  }

  async startMeeting(payload: MeetingStartPayload) {
    const meeting = await this.gameplayRepository.createMeeting(payload.matchId, payload.triggeredByUserId, payload.reason);
    return { meeting };
  }

  async castVote(payload: VoteCastPayload) {
    const vote = await this.gameplayRepository.createVote(payload.matchId, payload.meetingId, payload.voterUserId, payload.targetUserId);
    const totalVotes = await this.gameplayRepository.countVotesForMeeting(payload.meetingId);
    const matchState = await this.matchesRepository.getMatch(payload.matchId);
    const playerCount = await this.countPlayersForMatch(payload.matchId);
    const majorityThreshold = Math.floor(playerCount / 2) + 1;

    if (totalVotes >= majorityThreshold && matchState?.status === 'active') {
      const roleAssignments = (matchState.roleAssignments ?? {}) as Record<string, GameRole>;
      const targetRole = roleAssignments[payload.targetUserId ?? ''] ?? 'crew';
      const winnerTeam = targetRole === 'imposter' ? 'crew' : 'imposters';
      await this.finishMatch(payload.matchId, {
        winnerTeam,
        endingReason: 'The meeting reached a majority vote.',
        summary: `The table voted out ${payload.targetUserId ?? 'no one'}.`,
        learningRecap: this.buildLearningRecap(winnerTeam, 'Meeting outcomes showed how voting can change the final state of the match.'),
      });
    }

    return {
      vote,
      totalVotes,
      majorityThreshold,
    };
  }

  async startTimer(matchId: string, timerSeconds: number) {
    return this.matchesRepository.updateMatch(matchId, {
      timerSecondsRemaining: timerSeconds,
      status: 'active',
    });
  }

  async tickTimer(matchId: string, seconds = 1) {
    const match = await this.matchesRepository.getMatch(matchId);
    if (!match) {
      throw new Error('Match not found.');
    }

    const nextValue = Math.max(0, match.timerSecondsRemaining - seconds);
    const updatedMatch = await this.matchesRepository.updateMatch(matchId, {
      timerSecondsRemaining: nextValue,
    });

    if (nextValue === 0 && updatedMatch?.status === 'active') {
      const winnerTeam = updatedMatch.shipReadiness >= 100 ? 'crew' : 'imposters';
      await this.finishMatch(matchId, {
        winnerTeam,
        endingReason: 'The match timer expired.',
        summary: 'The countdown reached zero before the team could fully stabilize the ship.',
        learningRecap: this.buildLearningRecap(winnerTeam, 'Timer pressure exposed collaboration and debugging gaps.'),
      });
    }

    return updatedMatch;
  }

  async finishMatch(matchId: string, payload: { winnerTeam: string; endingReason: string; summary: string; learningRecap: string }) {
    return this.matchesRepository.createMatchResult(matchId, payload);
  }

  async getRecap(matchId: string) {
    const matchResult = await this.matchesRepository.getMatchResult(matchId);
    if (matchResult) {
      return matchResult;
    }

    const match = await this.matchesRepository.getMatch(matchId);
    return {
      matchId,
      winnerTeam: 'pending',
      endingReason: 'Match still in progress.',
      summary: 'The match has not ended yet.',
      learningRecap: this.buildLearningRecap((match?.shipReadiness ?? 0) >= 100 ? 'crew' : 'pending', 'A recap will be generated when the match ends.'),
    };
  }

  private assignRoles(playerIds: string[]): Record<string, GameRole> {
    const shuffledPlayerIds = shuffle(playerIds);
    const roleAssignments: Record<string, GameRole> = {};
    const imposterCount = shuffledPlayerIds.length >= 5 ? 2 : shuffledPlayerIds.length >= 3 ? 1 : 0;

    shuffledPlayerIds.forEach((playerId, index) => {
      roleAssignments[playerId] = index < imposterCount ? 'imposter' : 'crew';
    });

    return roleAssignments;
  }

  private buildTaskTemplates(): TaskTemplate[] {
    return [
      {
        title: 'Fix failing integration test',
        description: 'Repair the test path that is preventing the feature branch from merging.',
        difficulty: 'medium',
        isSabotage: false,
      },
      {
        title: 'Review API payload mismatch',
        description: 'Compare the client contract to the server response and patch the mismatch.',
        difficulty: 'medium',
        isSabotage: false,
      },
      {
        title: 'Investigate timeout regression',
        description: 'Find the source of the request timeout before the build pipeline fails again.',
        difficulty: 'hard',
        isSabotage: false,
      },
      {
        title: 'Remove hidden sabotage',
        description: 'Identify and patch the realistic fault slipped into the project by the imposter.',
        difficulty: 'hard',
        isSabotage: true,
      },
    ];
  }

  private async calculateShipReadiness(matchId: string) {
    const completedTasks = await this.matchesRepository.countCompletedTasks(matchId);
    const totalTasks = await this.matchesRepository.countTotalTasks(matchId);

    if (totalTasks === 0) {
      return 0;
    }

    return Math.min(100, Math.round((completedTasks / totalTasks) * 100));
  }

  private async countPlayersForMatch(matchId: string) {
    const match = await this.matchesRepository.getMatch(matchId);
    if (!match) {
      return 0;
    }

    return Object.keys((match.roleAssignments ?? {}) as Record<string, GameRole>).length;
  }

  private buildLearningRecap(winnerTeam: string, context: string) {
    return `Winner: ${winnerTeam}. ${context}`;
  }
}

export const matchesService = new MatchesService();
