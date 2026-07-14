import type { Server, Socket } from 'socket.io';

import type { MatchInitializationResponse, TaskSubmissionResponse } from '../contracts';

import { matchesService } from '../services/matches.service';
import { verifyGameToken } from '../security/jwt';

function matchRoom(matchId: string) {
  return `match:${matchId}`;
}

let ioInstance: Server | null = null;

export function setGameSocketServer(io: Server) {
  ioInstance = io;
}

export function broadcastMatchStarted(matchId: string, payload: MatchInitializationResponse) {
  ioInstance?.to(matchRoom(matchId)).emit('match:started', payload);
  payload.match?.roleAssignments && Object.entries(payload.match.roleAssignments).forEach(([userId, role]) => {
    ioInstance?.to(matchRoom(matchId)).emit('role:assigned', { userId, role });
  });
  payload.tasks.forEach((task) => {
    ioInstance?.to(matchRoom(matchId)).emit('task:assigned', task);
  });
}

export function broadcastSubmissionReviewed(payload: TaskSubmissionResponse) {
  ioInstance?.to(matchRoom(payload.matchId)).emit('submission:reviewed', payload);
}

async function joinMatchRoom(socket: Socket, payload: { matchId: string; token: string }) {
  verifyGameToken(payload.token);
  const match = await matchesService.getMatch(payload.matchId);
  if (!match.match) {
    throw new Error('Match not found.');
  }

  await socket.join(matchRoom(payload.matchId));
  socket.emit('player:connected', { userId: payload.token });
  socket.emit('match:joined', match);
}

export function registerGameSockets(io: Server) {
  setGameSocketServer(io);
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

    socket.on('task:submit', async (payload: { matchId: string; token: string; taskText: string }) => {
      try {
        verifyGameToken(payload.token);
        const result = await matchesService.reviewTaskSubmission({
          matchId: payload.matchId,
          userId: socket.id,
          taskText: payload.taskText,
        });
        broadcastSubmissionReviewed(result);
      } catch (error) {
        socket.emit('match:error', { message: error instanceof Error ? error.message : 'Failed to submit commit.' });
      }
    });
  });
}
