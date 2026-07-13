import { Router } from 'express';

import { lobbiesController } from '../controllers/lobbies.controller';

export const lobbiesRouter = Router();

lobbiesRouter.post('/', (request, response) => lobbiesController.createLobby(request, response));
lobbiesRouter.post('/:lobbyId/join', (request, response) => lobbiesController.joinLobby(request, response));
lobbiesRouter.post('/:lobbyId/leave', (request, response) => lobbiesController.leaveLobby(request, response));
lobbiesRouter.post('/:lobbyId/ready', (request, response) => lobbiesController.setReady(request, response));
lobbiesRouter.post('/:lobbyId/start', (request, response) => lobbiesController.startLobby(request, response));
