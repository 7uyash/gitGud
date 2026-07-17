import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth.routes';
import { lobbiesRouter } from './routes/lobbies.routes';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth & Lobby Service API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const openapiSpecification = swaggerJsdoc(swaggerOptions);

export const authLobbyApp = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

authLobbyApp.use(helmet());
authLobbyApp.use(cors());
authLobbyApp.use(express.json());
authLobbyApp.use(limiter);

authLobbyApp.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));
authLobbyApp.get('/health', (_request, response) => response.status(200).json({ ok: true, service: 'auth-lobby' }));
authLobbyApp.use('/auth', authRouter);
authLobbyApp.use('/lobbies', lobbiesRouter);
authLobbyApp.use((_request, response) => response.status(404).json({ message: 'Route not found.' }));
