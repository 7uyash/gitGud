import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { authRouter } from './routes/auth.routes';
import { lobbiesRouter } from './routes/lobbies.routes';

export const authLobbyApp = express();

authLobbyApp.use(helmet());
authLobbyApp.use(cors());
authLobbyApp.use(express.json());
authLobbyApp.get('/health', (_request, response) => response.status(200).json({ ok: true, service: 'auth-lobby' }));
authLobbyApp.use('/auth', authRouter);
authLobbyApp.use('/lobbies', lobbiesRouter);
authLobbyApp.use((_request, response) => response.status(404).json({ message: 'Route not found.' }));
