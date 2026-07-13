import 'dotenv/config';

import { authLobbyEnv } from './config/env';
import { authLobbyApp } from './app';

authLobbyApp.listen(authLobbyEnv.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Auth & Lobby Service listening on port ${authLobbyEnv.port}`);
});
