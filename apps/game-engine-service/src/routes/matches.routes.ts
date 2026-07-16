import { Router } from 'express';

import { matchesController } from '../controllers/matches.controller';
import { requireGameAuth } from '../middleware/auth.middleware';

export const matchesRouter = Router();

matchesRouter.use(requireGameAuth);
matchesRouter.get('/:matchId', (request, response) => matchesController.getMatch(request, response));
matchesRouter.post('/start', (request, response) => matchesController.startMatch(request, response));
matchesRouter.post('/:matchId/submissions', (request, response) => matchesController.submitTask(request, response));
matchesRouter.get('/:matchId/commits', (request, response) => matchesController.getCommits(request, response));
matchesRouter.get('/:matchId/recap', (request, response) => matchesController.getRecap(request, response));
matchesRouter.get('/:matchId/recap/:userId', (request, response) => matchesController.getPlayerRecap(request, response));
