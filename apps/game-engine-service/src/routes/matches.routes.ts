import { Router } from 'express';

import { matchesController } from '../controllers/matches.controller';

export const matchesRouter = Router();

matchesRouter.get('/:matchId', (request, response) => matchesController.getMatch(request, response));
matchesRouter.post('/:matchId/initialize', (request, response) => matchesController.initializeMatch(request, response));
matchesRouter.post('/:matchId/commits', (request, response) => matchesController.submitCommit(request, response));
matchesRouter.post('/:matchId/reviews', (request, response) => matchesController.reviewCommit(request, response));
matchesRouter.post('/:matchId/meetings', (request, response) => matchesController.startMeeting(request, response));
matchesRouter.post('/:matchId/votes', (request, response) => matchesController.castVote(request, response));
matchesRouter.post('/:matchId/timer/start', (request, response) => matchesController.startTimer(request, response));
matchesRouter.post('/:matchId/timer/tick', (request, response) => matchesController.tickTimer(request, response));
matchesRouter.post('/:matchId/result', (request, response) => matchesController.finishMatch(request, response));
matchesRouter.get('/:matchId/recap', (request, response) => matchesController.getRecap(request, response));
