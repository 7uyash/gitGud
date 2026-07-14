import { Router } from 'express';

import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/github', (request, response) => authController.githubLogin(request, response));
authRouter.post('/logout', (_request, response) => response.status(200).json({ ok: true }));
authRouter.get('/me', requireAuth, (request, response) => authController.me(request, response));
