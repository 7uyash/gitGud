import type { Server, Socket } from 'socket.io';

import type { MatchInitializationResponse, TaskSubmissionResponse } from '../contracts';

import { matchesService } from '../services/matches.service';
import { verifyGameToken } from '../security/jwt';

function matchRoom(matchId: string) {
  return `match:${matchId}`;
}

let ioInstance: Server | null = null;

// Meeting state tracking: matchId -> meeting state
interface MeetingState {
  id: string;
  matchId: string;
  callerUserId: string;
  reason: string;
  endTime: number;
  votes: Record<string, string | 'skip'>; // voterId -> targetUserId | 'skip'
}
const activeMeetings: Record<string, MeetingState> = {};

// Server-side timer: track which matches are actively ticking
const timerMatchIds = new Set<string>();

function startTimerLoop() {
  setInterval(async () => {
    for (const matchId of timerMatchIds) {
      try {
        const updated = await matchesService.tickTimer(matchId, 1);
        if (!updated) {
          timerMatchIds.delete(matchId);
          continue;
        }
        // Broadcast authoritative timer + ship readiness so all clients stay in sync
        ioInstance?.to(matchRoom(matchId)).emit('match:tick', {
          matchId,
          timerSecondsRemaining: updated.timerSecondsRemaining,
          shipReadiness: updated.shipReadiness,
        });
        // If the match just finished (tickTimer triggered finishMatch), stop ticking and notify
        if (updated.status === 'finished') {
          timerMatchIds.delete(matchId);
          const result = await matchesService.getRecap(matchId);
          ioInstance?.to(matchRoom(matchId)).emit('match:ended', result);
        }
      } catch {
        timerMatchIds.delete(matchId);
      }
    }
  }, 1000);
}

export function setGameSocketServer(io: Server) {
  ioInstance = io;
}

export function broadcastMatchStarted(lobbyId: string, matchId: string, payload: MatchInitializationResponse) {
  timerMatchIds.add(matchId);
  // Broadcast to the lobby room so all players in the lobby navigate to the match
  ioInstance?.to(`lobby:${lobbyId}`).emit('match:started', payload);
  // Also broadcast to the match room for any early joiners
  ioInstance?.to(matchRoom(matchId)).emit('match:started', payload);
  payload.match?.roleAssignments && Object.entries(payload.match.roleAssignments).forEach(([userId, role]) => {
    ioInstance?.to(matchRoom(matchId)).emit('role:assigned', { userId, role });
    ioInstance?.to(`lobby:${lobbyId}`).emit('role:assigned', { userId, role });
  });
  payload.tasks.forEach((task) => {
    ioInstance?.to(matchRoom(matchId)).emit('task:assigned', task);
    ioInstance?.to(`lobby:${lobbyId}`).emit('task:assigned', task);
  });
}

export function broadcastSubmissionReviewed(payload: TaskSubmissionResponse) {
  ioInstance?.to(matchRoom(payload.matchId)).emit('submission:reviewed', payload);
}

async function joinMatchRoom(socket: Socket, payload: { matchId: string; token: string }) {
  const claims = verifyGameToken(payload.token);
  const match = await matchesService.getMatch(payload.matchId);
  if (!match.match) {
    throw new Error('Match not found.');
  }

  await socket.join(matchRoom(payload.matchId));
  socket.emit('player:connected', { userId: claims.userId });
  socket.emit('match:joined', match);
}

export function registerGameSockets(io: Server) {
  setGameSocketServer(io);
  startTimerLoop();
  io.on('connection', (socket) => {
    socket.emit('player:connected', { userId: socket.id });

    socket.on('match:join', async (payload: { matchId: string; token: string }) => {
      try {
        await joinMatchRoom(socket, payload);
        io.to(matchRoom(payload.matchId)).emit('player:joined', { lobbyId: payload.matchId, userId: socket.id });
      } catch (error) {
        socket.emit('match:error', { message: error instanceof Error ? error.message : 'Failed to join match.' });
      }
    });

    socket.on('match:leave', async (payload: { matchId: string }) => {
      io.to(matchRoom(payload.matchId)).emit('player:left', { lobbyId: payload.matchId, userId: socket.id });
      await socket.leave(matchRoom(payload.matchId));
    });

    socket.on('lobby:watch', (lobbyId: string) => {
      socket.join(`lobby:${lobbyId}`);
    });

    socket.on('lobby:unwatch', (lobbyId: string) => {
      socket.leave(`lobby:${lobbyId}`);
    });

    socket.on('lobby:changed', (lobbyId: string) => {
      socket.to(`lobby:${lobbyId}`).emit('lobby:changed');
    });

    socket.on('editor:change', (payload: { matchId: string; file: string; content: string }) => {
      socket.to(matchRoom(payload.matchId)).emit('editor:change', payload);
    });

    socket.on('chat:message', (payload: { matchId: string; username: string; text: string }) => {
      io.to(matchRoom(payload.matchId)).emit('chat:message', payload);
    });

    socket.on('task:submit', async (payload: { matchId: string; token: string; taskText: string }) => {
      try {
        const decoded = verifyGameToken(payload.token);
        const result = await matchesService.reviewTaskSubmission({
          matchId: payload.matchId,
          userId: decoded.userId,
          taskText: payload.taskText,
        });
        broadcastSubmissionReviewed(result);
      } catch (error) {
        socket.emit('match:error', { message: error instanceof Error ? error.message : 'Failed to submit commit.' });
      }
    });

    socket.on('meeting:called', (payload: { matchId: string; token: string; reason: string }) => {
      try {
        const decoded = verifyGameToken(payload.token);
        const matchId = payload.matchId;
        
        if (activeMeetings[matchId]) {
          socket.emit('match:error', { message: 'A meeting is already active.' });
          return;
        }

        const meetingId = `meeting_${Date.now()}`;
        const endTime = Date.now() + 45000; // 45 seconds

        activeMeetings[matchId] = {
          id: meetingId,
          matchId,
          callerUserId: decoded.userId,
          reason: payload.reason,
          endTime,
          votes: {},
        };

        io.to(matchRoom(matchId)).emit('meeting:started', {
          id: meetingId,
          matchId,
          callerUserId: decoded.userId,
          reason: payload.reason,
          endTime,
        });

        // Automatically end the meeting when time is up
        setTimeout(() => {
          if (activeMeetings[matchId] && activeMeetings[matchId].id === meetingId) {
            endMeeting(matchId);
          }
        }, 45000);

      } catch (error) {
        socket.emit('match:error', { message: 'Failed to call meeting.' });
      }
    });

    socket.on('meeting:vote', (payload: { matchId: string; token: string; targetUserId: string | 'skip' }) => {
      try {
        const decoded = verifyGameToken(payload.token);
        const matchId = payload.matchId;
        const meeting = activeMeetings[matchId];

        if (!meeting) {
          socket.emit('match:error', { message: 'No active meeting.' });
          return;
        }

        meeting.votes[decoded.userId] = payload.targetUserId;

        io.to(matchRoom(matchId)).emit('meeting:voted', {
          userId: decoded.userId,
        });

        // Check if everyone has voted (assuming players are known on client side or we check via match service)
        // For simplicity, we just rely on the timeout or a manual check if all connected players voted
        
      } catch (error) {
        socket.emit('match:error', { message: 'Failed to cast vote.' });
      }
    });

    socket.on('match:end', (payload: { matchId: string; token: string; winnerTeam: 'CREW' | 'IMPOSTERS' }) => {
      try {
        verifyGameToken(payload.token);
        const { matchId, winnerTeam } = payload;
        
        const recapPayload = {
          matchId,
          winnerTeam,
          endingReason: winnerTeam === 'CREW' ? 'All imposters identified' : 'Imposters outlived the crew',
          summary: 'The match has concluded.',
          learningRecap: 'Great job finding the bugs. Some areas to improve: Always check for null values before rendering.',
        };

        io.to(matchRoom(matchId)).emit('match:ended', recapPayload);
      } catch (error) {
        socket.emit('match:error', { message: 'Failed to end match.' });
      }
    });
  });
}

function endMeeting(matchId: string) {
  const meeting = activeMeetings[matchId];
  if (!meeting) return;

  const voteCounts: Record<string, number> = {};
  let skipCount = 0;

  for (const vote of Object.values(meeting.votes)) {
    if (vote === 'skip') {
      skipCount++;
    } else {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    }
  }

  let ejectedPlayerId: string | null = null;
  let maxVotes = 0;
  let isTie = false;

  for (const [userId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      ejectedPlayerId = userId;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }

  if (isTie || skipCount >= maxVotes) {
    ejectedPlayerId = null;
  }

  ioInstance?.to(matchRoom(matchId)).emit('meeting:ended', {
    meetingId: meeting.id,
    votes: meeting.votes,
    voteCounts,
    skipCount,
    ejectedPlayerId,
  });

  delete activeMeetings[matchId];

  if (ejectedPlayerId) {
    // Persist ejection and check win conditions
    matchesService.resolveEjection(matchId, ejectedPlayerId).catch(err => {
      console.error('[endMeeting] Failed to resolve ejection:', err);
    });
  }
}
