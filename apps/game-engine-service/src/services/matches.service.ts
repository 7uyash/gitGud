import type { CommitReviewPayload, CommitSubmitPayload, GameRole, MatchInitializationPayload, MatchInitializationResponse, MatchStateDto, MeetingStartPayload, ReviewFeedback, TaskSubmissionPayload, TaskSubmissionResponse, VoteCastPayload } from '../contracts';
import Groq from 'groq-sdk';
import { db, users } from '@gitgud/database';
import { inArray } from 'drizzle-orm';
import { gameEngineEnv } from '../config/env';

const groq = gameEngineEnv.groqApiKey ? new Groq({ apiKey: gameEngineEnv.groqApiKey }) : null;

import { GameplayRepository } from '../repositories/gameplay.repository';
import { LobbiesRepository } from '../repositories/lobbies.repository';
import { MatchesRepository } from '../repositories/matches.repository';
import { TasksRepository, type TaskTemplate } from '../repositories/tasks.repository';
import { EventsRepository } from '../repositories/events.repository';
import { gameMasterAgent } from '../agents/gamemaster.agent';
import { recapAgent } from '../agents/recap.agent';

type MatchRow = Awaited<ReturnType<MatchesRepository['getMatch']>> extends infer Result ? NonNullable<Result> : never;
type TaskRow = Awaited<ReturnType<TasksRepository['listTasks']>>[number];
type MatchResultRow = Awaited<ReturnType<MatchesRepository['getMatchResult']>> extends infer Result ? NonNullable<Result> : never;

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

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
  private readonly eventsRepository = new EventsRepository();

  async initializeMatch(payload: MatchInitializationPayload) {
    const lobby = await this.lobbiesRepository.findLobbyById(payload.lobbyId);
    if (!lobby) {
      throw new Error('Lobby not found.');
    }

    const roleAssignments = this.assignRoles(payload.playerIds);
    const match = await this.matchesRepository.createMatch(payload.lobbyId, roleAssignments, payload.timerSeconds);

    // Use AI Game Master to generate tasks dynamically
    const taskTemplates = await this.buildTaskTemplatesWithAI(payload.playerIds.length);
    const createdTasks = await this.tasksRepository.createTasks(match.id, taskTemplates);

    const assignments = createdTasks.flatMap((task: (typeof createdTasks)[number], index: number) => {
      const userId = payload.playerIds[index % payload.playerIds.length];
      return userId ? [{ matchId: match.id, taskId: task.id, userId }] : [];
    });

    await this.matchesRepository.createPlayerTaskAssignments(assignments);

    // Log match initialization event
    await this.eventsRepository.logEvent(match.id, null, 'match_initialized', {
      playerCount: payload.playerIds.length,
      taskCount: createdTasks.length,
      aiGenerated: gameMasterAgent.isAvailable,
    });

    const response: MatchInitializationResponse = {
      match: this.serializeMatch(match),
      roleAssignments,
      tasks: createdTasks.map((task) => this.serializeTask(task)),
    };

    return response;
  }

  async getMatch(matchId: string) {
    const match = await this.matchesRepository.getMatch(matchId);
    const result = await this.matchesRepository.getMatchResult(matchId);
    const tasks = await this.tasksRepository.listTasks(matchId);

    let players: Array<{ userId: string; username: string }> = [];
    if (match) {
      const userIds = Object.keys(match.roleAssignments || {});
      if (userIds.length > 0) {
        players = (await db.select({ userId: users.id, username: users.username }).from(users).where(inArray(users.id, userIds)));
      }
    }

    const response: MatchStateDto = {
      match: match ? this.serializeMatch(match) : null,
      result: result ? this.serializeMatchResult(result) : null,
      tasks: tasks.map((task) => this.serializeTask(task)),
      players,
    };

    return response;
  }

  async submitCommit(payload: CommitSubmitPayload) {
    const commit = await this.gameplayRepository.createCommit(payload.matchId, payload.userId, payload.commitHash, payload.message, payload.diffText);
    return {
      commit,
    };
  }

  async reviewTaskSubmission(payload: TaskSubmissionPayload): Promise<TaskSubmissionResponse> {
    const assignedTask = await this.matchesRepository.getAssignedTaskForUser(payload.matchId, payload.userId);
    if (!assignedTask) {
      throw new Error('No task assigned to this user in this match.');
    }
    const task = await this.tasksRepository.getTask(assignedTask.taskId);
    if (!task) {
      throw new Error('Task not found.');
    }

    const feedback = await this.reviewSubmission(task, payload.taskText);
    const commitHash = `submission-${payload.userId}-${Date.now()}`;
    const commit = await this.gameplayRepository.createCommit(payload.matchId, payload.userId, commitHash, 'Task submission', payload.taskText);

    // Log task submission event
    await this.eventsRepository.logEvent(payload.matchId, payload.userId, feedback.status === 'PASS' ? 'task_passed' : 'task_failed', {
      taskId: assignedTask.taskId,
      taskTitle: task.title,
      score: feedback.score,
      feedback: feedback.feedback,
    });

    if (feedback.status === 'PASS') {
      await this.matchesRepository.completeAssignedTaskForUser(payload.matchId, payload.userId);
      const shipReadiness = await this.calculateShipReadiness(payload.matchId);
      await this.matchesRepository.updateMatch(payload.matchId, { shipReadiness });
    }

    return {
      submissionId: commit.id,
      matchId: payload.matchId,
      userId: payload.userId,
      taskText: payload.taskText,
      review: feedback,
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

  private async reviewSubmission(task: TaskRow, taskText: string): Promise<ReviewFeedback> {
    if (!groq) {
      const normalized = taskText.trim().toLowerCase();
      const score = Math.max(45, Math.min(100, 65 + Math.min(30, normalized.length)));
      const status = normalized.includes('fix') || normalized.includes('tested') || normalized.includes('validated') ? 'PASS' : 'NEEDS_WORK';
      const feedback = status === 'PASS'
        ? 'Submission shows a clear fix and validation path.'
        : 'Possible issue: the submission needs a clearer fix or verification step.';
      return { status, score, feedback };
    }

    const prompt = `
You are a senior software engineer reviewing a pull request submission.
Task Title: ${task.title}
Task Description: ${task.description}
Expected Solution:
${task.expectedSolution ?? 'No expected solution provided. Make a best judgement based on the description.'}

Player's Submission:
${taskText}

Evaluate the submission against the task and the expected solution.
Determine if it is correct or incorrect. Provide a brief explanation and a score (0 to 100).
Return JSON with: { "correct": boolean, "explanation": string, "hint": string, "score": number }
    `;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a code review assistant. Always respond with a valid JSON object matching this schema: ' + JSON.stringify({
            type: 'object',
            properties: {
              correct: { type: 'boolean', description: 'True if the submission solves the task.' },
              explanation: { type: 'string', description: 'Brief explanation of your evaluation.' },
              hint: { type: 'string', description: 'A helpful hint for the player.' },
              score: { type: 'number', description: 'A score from 0 to 100.' }
            },
            required: ['correct', 'explanation', 'hint', 'score']
          }) },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_completion_tokens: 512,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from Groq');
      
      const parsed = JSON.parse(content);
      return {
        status: parsed.correct ? 'PASS' : 'NEEDS_WORK',
        score: parsed.score,
        feedback: `${parsed.explanation}\nHint: ${parsed.hint}`,
      };
    } catch (e) {
      console.error('AI Review Error:', e);
      return { status: 'NEEDS_WORK', score: 0, feedback: 'Error analyzing submission.' };
    }
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
      // Try to parse AI recap if stored as JSON
      try {
        const aiRecap = JSON.parse(matchResult.learningRecap);
        if (aiRecap.overallNarrative) {
          return {
            ...this.serializeMatchResult(matchResult),
            aiRecap,
          };
        }
      } catch {
        // learningRecap is plain text, return as-is
      }
      return this.serializeMatchResult(matchResult);
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

  /**
   * Generate a player-specific AI recap.
   */
  async getPlayerRecap(matchId: string, userId: string) {
    const match = await this.matchesRepository.getMatch(matchId);
    if (!match) throw new Error('Match not found.');

    const tasks = await this.tasksRepository.listTasks(matchId);
    const playerAssignments = await this.matchesRepository.getAssignedTaskForUser(matchId, userId);
    const events = await this.eventsRepository.getEventsForPlayer(matchId, userId);
    const matchResult = await this.matchesRepository.getMatchResult(matchId);
    const roleAssignments = (match.roleAssignments ?? {}) as Record<string, GameRole>;

    // Get player username
    const [userRow] = await db.select({ username: users.username }).from(users).where(inArray(users.id, [userId]));
    const playerUsername = userRow?.username ?? 'player';

    // Determine task outcomes
    const taskData = tasks.map(t => {
      const aiMeta = (t.aiMetadata ?? {}) as Record<string, string>;
      const isCompleted = playerAssignments?.completedAt != null && playerAssignments?.taskId === t.id;
      const wasAttempted = events.some(e => e.eventType === 'task_passed' || e.eventType === 'task_failed');

      return {
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        isSabotage: t.isSabotage,
        faultType: aiMeta.faultType,
        targetConcept: aiMeta.targetConcept,
        codeSnippet: t.codeSnippet ?? undefined,
        expectedSolution: t.expectedSolution ?? undefined,
        playerAction: (isCompleted ? 'completed' : wasAttempted ? 'failed' : 'skipped') as 'completed' | 'failed' | 'skipped',
      };
    });

    const serializedEvents = events.map(e => ({
      eventType: e.eventType,
      payload: e.payload,
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    }));

    const recap = await recapAgent.generateRecap({
      matchId,
      winnerTeam: matchResult?.winnerTeam ?? 'pending',
      endingReason: matchResult?.endingReason ?? 'Match in progress',
      playerRole: roleAssignments[userId] ?? 'crew',
      tasks: taskData,
      events: serializedEvents,
      playerUsername,
    });

    return recap;
  }

  /**
   * Mark a player as ejected, stop their timer, and check all win conditions:
   * - All imposters ejected → crew wins
   * - Imposters outnumber or equal remaining crew → imposters win
   */
  async resolveEjection(matchId: string, ejectedPlayerId: string) {
    const match = await this.matchesRepository.getMatch(matchId);
    if (!match || match.status !== 'active') return;

    const roleAssignments = { ...(match.roleAssignments as Record<string, GameRole>) };

    // Remove the ejected player from future role calculations
    delete roleAssignments[ejectedPlayerId];
    await this.matchesRepository.updateMatch(matchId, { roleAssignments });

    const remaining = Object.values(roleAssignments);
    const remainingImposters = remaining.filter(r => r === 'imposter');
    const remainingCrew = remaining.filter(r => r === 'crew');

    if (remainingImposters.length === 0) {
      await this.finishMatch(matchId, {
        winnerTeam: 'crew',
        endingReason: 'All imposters have been ejected.',
        summary: 'The crew successfully identified and ejected all imposters.',
        learningRecap: this.buildLearningRecap('crew', 'The team identified all imposters through careful code review.'),
      });
    } else if (remainingImposters.length >= remainingCrew.length) {
      await this.finishMatch(matchId, {
        winnerTeam: 'imposters',
        endingReason: 'Imposters now equal or outnumber the remaining crew.',
        summary: 'Too many crewmates were ejected. The imposters have taken over.',
        learningRecap: this.buildLearningRecap('imposters', 'The imposters blended in long enough to outlast the crew.'),
      });
    }
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

  /**
   * Use AI Game Master to generate task templates dynamically.
   * Falls back to static templates when Groq API key is not set.
   */
  private async buildTaskTemplatesWithAI(playerCount: number): Promise<TaskTemplate[]> {
    const faults = await gameMasterAgent.generateFaults(playerCount, 1, 'normal', 0, 0);

    return faults.map(fault => ({
      title: fault.title,
      description: fault.description,
      difficulty: fault.difficulty,
      isSabotage: fault.isSabotage,
      expectedSolution: fault.expectedSolution,
      codeSnippet: fault.codeSnippet,
      aiMetadata: {
        generatedBy: gameMasterAgent.isAvailable ? 'ai' : 'static',
        faultType: fault.faultType,
        faultReasoning: fault.faultReasoning,
        targetConcept: fault.targetConcept,
        commitMessage: fault.commitMessage,
        verificationResult: fault.verificationResult,
        difficultyScore: fault.difficultyScore,
      },
    }));
  }

  /**
   * @deprecated Use buildTaskTemplatesWithAI instead. Kept for reference.
   */
  private buildTaskTemplates(): TaskTemplate[] {
    return [
      {
        title: 'Fix failing integration test',
        description: 'Repair the test path that is preventing the feature branch from merging.',
        difficulty: 'medium',
        isSabotage: false,
        expectedSolution: 'import { render, screen } from "@testing-library/react";\nimport App from "./App";\n\ntest("renders app", () => {\n  render(<App />);\n  const linkElement = screen.getByText(/learn react/i);\n  expect(linkElement).toBeInTheDocument();\n});',
      },
      {
        title: 'Review API payload mismatch',
        description: 'Compare the client contract to the server response and patch the mismatch.',
        difficulty: 'medium',
        isSabotage: false,
        expectedSolution: 'interface Payload {\n  userId: string;\n  status: "active" | "inactive";\n}\n\nfunction parsePayload(data: any): Payload {\n  return {\n    userId: data.user_id,\n    status: data.is_active ? "active" : "inactive",\n  };\n}',
      },
      {
        title: 'Investigate timeout regression',
        description: 'Find the source of the request timeout before the build pipeline fails again.',
        difficulty: 'hard',
        isSabotage: false,
        expectedSolution: 'async function fetchData() {\n  const controller = new AbortController();\n  const timeoutId = setTimeout(() => controller.abort(), 5000);\n  try {\n    const response = await fetch("/api/data", { signal: controller.signal });\n    return await response.json();\n  } finally {\n    clearTimeout(timeoutId);\n  }\n}',
      },
      {
        title: 'Remove hidden sabotage',
        description: 'Identify and patch the realistic fault slipped into the project by the imposter.',
        difficulty: 'hard',
        isSabotage: true,
        expectedSolution: 'function processPayment(amount: number) {\n  if (amount <= 0) throw new Error("Invalid amount");\n  // REMOVED: amount = amount * -1; \n  return externalPaymentService.charge(amount);\n}',
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

  private serializeMatch(match: MatchRow) {
    return {
      ...match,
      startedAt: serializeDate(match.startedAt),
      endedAt: serializeDate(match.endedAt),
      createdAt: serializeDate(match.createdAt) ?? '',
      roleAssignments: (match.roleAssignments ?? {}) as Record<string, GameRole>,
    };
  }

  private serializeTask(task: TaskRow) {
    return {
      ...task,
      createdAt: serializeDate(task.createdAt) ?? '',
    };
  }

  private serializeMatchResult(matchResult: MatchResultRow) {
    return {
      ...matchResult,
      createdAt: serializeDate(matchResult.createdAt) ?? '',
    };
  }

  private buildLearningRecap(winnerTeam: string, context: string) {
    return `Winner: ${winnerTeam}. ${context}`;
  }
}

export const matchesService = new MatchesService();
