import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { matchesRouter } from './routes/matches.routes';

export const gameEngineApp = express();

gameEngineApp.use(helmet());
gameEngineApp.use(cors());
gameEngineApp.use(express.json());
gameEngineApp.get('/health', (_request, response) => response.status(200).json({ ok: true, service: 'game-engine' }));
gameEngineApp.use('/matches', matchesRouter);
gameEngineApp.use((_request, response) => response.status(404).json({ message: 'Route not found.' }));
