import { Router } from 'express';

import { authController } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/github', (request, response) => authController.githubLogin(request, response));
authRouter.get('/me', (request, response) => authController.me(request, response));
