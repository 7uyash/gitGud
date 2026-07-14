export type GameRole = 'crew' | 'imposter' | 'support';

export interface GitHubProfile {
  githubId: string;
  username: string;
  avatarUrl: string;
  displayName: string;
}

export interface JwtClaims {
  userId: string;
  username: string;
}

export interface AuthSession {
  userId: string;
  token: string;
}

export interface AuthenticatedUser {
  id: string;
  githubId: string;
  username: string;
  avatarUrl: string;
  displayName: string;
  createdAt: string;
}

export interface CurrentUserResponse {
  user: AuthenticatedUser;
  claims: JwtClaims;
}

export interface LobbyPlayerSnapshot {
  userId: string;
  username: string;
  avatarUrl: string;
  displayName: string;
  isReady: boolean;
}

export interface LobbyStartPayload {
  lobbyId: string;
  hostUserId: string;
  playerIds: string[];
  timerSeconds: number;
}

export interface LobbyDto {
  id: string;
  hostUserId: string;
  status: string;
  maxPlayers: number;
  joinCode: string;
  createdAt: string;
}

export interface LobbySnapshotResponse {
  lobby: LobbyDto;
  players: LobbyPlayerSnapshot[];
}