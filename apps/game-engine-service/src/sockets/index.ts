import type { Server, Socket } from 'socket.io';

import type { CommitReviewPayload, CommitSubmitPayload, MeetingStartPayload, VoteCastPayload } from '@gitgud/shared';

import { matchesService } from '../services/matches.service';
import { verifyGameToken } from '../security/jwt';

function matchRoom(matchId: string) {
  return `match:${matchId}`;
}

async function joinMatchRoom(socket: Socket, payload: { matchId: string; token: string }) {
  verifyGameToken(payload.token);
  const match = await matchesService.getMatch(payload.matchId);
  if (!match.match) {
    throw new Error('Match not found.');
  }

  await socket.join(matchRoom(payload.matchId));
  socket.emit('match:joined', match);
}

export function registerGameSockets(io: Server) {
  io.on('connection', (socket) => {
    socket.on('match:join', async (payload: { matchId: string; token: string }) => {
      try {
        await joinMatchRoom(socket, payload);
      } catch (error) {
        socket.emit('match:error', { message: error instanceof Error ? error.message : 'Failed to join match.' });
      }
    });

    socket.on('commit:submit', async (payload: CommitSubmitPayload & { token: string }) => {
      try {
        verifyGameToken(payload.token);
        const result = await matchesService.submitCommit(payload);
        io.to(matchRoom(payload.matchId)).emit('commit:submitted', result);
      } catch (error) {
        socket.emit('match:error', { message: error instanceof Error ? error.message : 'Failed to submit commit.' });
      }
    });

    socket.on('commit:review', async (payload: CommitReviewPayload & { token: string }) => {
      try {
        verifyGameToken(payload.token);
        const result = await matchesService.reviewCommit(payload);
        io.to(matchRoom(payload.matchId)).emit('commit:reviewed', result);
      } catch (error) {
        socket.emit('match:error', { message: error instanceof Error ? error.message : 'Failed to review commit.' });
      }
    });

    socket.on('meeting:start', async (payload: MeetingStartPayload & { token: string }) => {
      try {
        verifyGameToken(payload.token);
        const result = await matchesService.startMeeting(payload);
        io.to(matchRoom(payload.matchId)).emit('meeting:started', result);
      } catch (error) {
        socket.emit('match:error', { message: error instanceof Error ? error.message : 'Failed to start meeting.' });
      }
    });

    socket.on('vote:cast', async (payload: VoteCastPayload & { token: string }) => {
      try {
        verifyGameToken(payload.token);
        const result = await matchesService.castVote(payload);
        io.to(matchRoom(payload.matchId)).emit('vote:cast', result);
      } catch (error) {
        socket.emit('match:error', { message: error instanceof Error ? error.message : 'Failed to cast vote.' });
      }
    });

    socket.on('timer:tick', async (payload: { matchId: string; seconds?: number; token: string }) => {
      try {
        verifyGameToken(payload.token);
        const result = await matchesService.tickTimer(payload.matchId, payload.seconds ?? 1);
        io.to(matchRoom(payload.matchId)).emit('timer:ticked', result);
      } catch (error) {
        socket.emit('match:error', { message: error instanceof Error ? error.message : 'Failed to tick timer.' });
      }
    });
  });
}
