import { Router } from 'express';

import { lobbiesController } from '../controllers/lobbies.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const lobbiesRouter = Router();

lobbiesRouter.use(requireAuth);
lobbiesRouter.post('/', (request, response) => lobbiesController.createLobby(request, response));
lobbiesRouter.get('/public', (request, response) => lobbiesController.listPublicLobbies(request, response));
lobbiesRouter.post('/by-code/:code/join', (request, response) => lobbiesController.joinLobbyByCode(request, response));
lobbiesRouter.get('/:lobbyId', (request, response) => lobbiesController.getLobby(request, response));
lobbiesRouter.post('/:lobbyId/join', (request, response) => lobbiesController.joinLobby(request, response));
lobbiesRouter.post('/:lobbyId/leave', (request, response) => lobbiesController.leaveLobby(request, response));
lobbiesRouter.post('/:lobbyId/ready', (request, response) => lobbiesController.setReady(request, response));
lobbiesRouter.post('/:lobbyId/start', (request, response) => lobbiesController.startLobby(request, response));
