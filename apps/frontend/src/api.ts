import type { MatchInitializationResponse, MatchStateDto, ReviewFeedback, TaskSubmissionResponse } from './types';
import { getToken } from './auth';

const authBaseUrl = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:4101';
const gameBaseUrl = import.meta.env.VITE_GAME_API_URL ?? 'http://localhost:4102';

async function request<T>(baseUrl: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed.' }));
    throw new Error(payload.message ?? 'Request failed.');
  }

  return response.json() as Promise<T>;
}

export interface LoginPayload {
  githubId: string;
  username: string;
  avatarUrl: string;
  displayName: string;
}

export interface CurrentUserResponse {
  user: {
    id: string;
    githubId: string;
    username: string;
    avatarUrl: string;
    displayName: string;
    createdAt: string;
  };
  claims: {
    userId: string;
    username: string;
  };
}

export async function loginWithGitHub(payload: LoginPayload) {
  return request<{ userId: string; token: string }>(authBaseUrl, '/auth/github', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser() {
  return request<CurrentUserResponse>(authBaseUrl, '/auth/me');
}

export async function logout() {
  return request<{ ok: boolean }>(authBaseUrl, '/auth/logout', { method: 'POST' });
}

export async function createLobby(maxPlayers: number) {
  return request<{ lobby: { id: string; hostUserId: string; status: string; maxPlayers: number; joinCode: string; createdAt: string }; hostPlayer: { id: string; lobbyId: string; userId: string; isReady: boolean; joinedAt: string } }>(authBaseUrl, '/lobbies', {
    method: 'POST',
    body: JSON.stringify({ maxPlayers }),
  });
}

export async function getLobby(lobbyId: string) {
  return request<{ lobby: { id: string; hostUserId: string; status: string; maxPlayers: number; joinCode: string; createdAt: string }; players: Array<{ userId: string; username: string; avatarUrl: string; displayName: string; isReady: boolean }> }>(authBaseUrl, `/lobbies/${lobbyId}`);
}

export async function joinLobby(lobbyId: string) {
  return request<ReturnType<typeof getLobby> extends Promise<infer T> ? T : never>(authBaseUrl, `/lobbies/${lobbyId}/join`, { method: 'POST' });
}

export async function leaveLobby(lobbyId: string) {
  return request<ReturnType<typeof getLobby> extends Promise<infer T> ? T : never>(authBaseUrl, `/lobbies/${lobbyId}/leave`, { method: 'POST' });
}

export async function setReady(lobbyId: string, isReady: boolean) {
  return request<ReturnType<typeof getLobby> extends Promise<infer T> ? T : never>(authBaseUrl, `/lobbies/${lobbyId}/ready`, {
    method: 'POST',
    body: JSON.stringify({ isReady }),
  });
}

export async function startLobby(lobbyId: string) {
  return request<{ lobbyId: string; hostUserId: string; playerIds: string[]; timerSeconds: number }>(authBaseUrl, `/lobbies/${lobbyId}/start`, {
    method: 'POST',
  });
}

export async function startMatch(payload: { lobbyId: string; playerIds: string[]; timerSeconds: number }) {
  return request<MatchInitializationResponse>(gameBaseUrl, '/matches/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMatch(matchId: string) {
  return request<MatchStateDto>(gameBaseUrl, `/matches/${matchId}`);
}

export async function submitTask(matchId: string, taskText: string) {
  return request<TaskSubmissionResponse>(gameBaseUrl, `/matches/${matchId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({ taskText }),
  });
}

export type { MatchInitializationResponse, MatchStateDto, ReviewFeedback, TaskSubmissionResponse };