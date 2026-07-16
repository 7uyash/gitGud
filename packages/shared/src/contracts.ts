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

export interface LobbyPlayerSnapshot {
  userId: string;
  username: string;
  avatarUrl: string;
  displayName: string;
  isReady: boolean;
}

export interface MatchInitializationPlayer {
  userId: string;
  role: GameRole;
}

export interface MatchInitializationPayload {
  matchId: string;
  lobbyId: string;
  players: MatchInitializationPlayer[];
  timerSeconds: number;
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

export interface LobbyPlayerDto extends LobbyPlayerSnapshot {
  id: string;
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
  players: LobbyPlayerDto[];
}

export interface LobbyStartPayload {
  lobbyId: string;
  hostUserId: string;
  playerIds: string[];
  timerSeconds: number;
}

export interface MatchTaskDto {
  id: string;
  matchId: string;
  title: string;
  description: string;
  difficulty: string;
  status: string;
  isSabotage: boolean;
  createdAt: string;
}

export interface MatchPlayerRole {
  userId: string;
  role: GameRole;
}

export interface MatchStateDto {
  match: {
    id: string;
    lobbyId: string;
    status: string;
    startedAt: string | null;
    endedAt: string | null;
    shipReadiness: number;
    timerSecondsRemaining: number;
    roleAssignments: Record<string, GameRole>;
    createdAt: string;
  } | null;
  result: {
    id: string;
    matchId: string;
    winnerTeam: string;
    endingReason: string;
    summary: string;
    learningRecap: string;
    createdAt: string;
  } | null;
  tasks: MatchTaskDto[];
  players?: Array<{ userId: string; username: string; avatarUrl?: string; displayName?: string }>;
  myTaskId?: string;
}

export interface MatchInitializationResponse {
  match: MatchStateDto['match'];
  roleAssignments: Record<string, GameRole>;
  tasks: MatchTaskDto[];
}

export interface TaskSubmissionPayload {
  matchId: string;
  userId: string;
  taskText: string;
}

export interface ReviewFeedback {
  status: 'PASS' | 'NEEDS_WORK';
  score: number;
  feedback: string;
}

export interface TaskSubmissionResponse {
  submissionId: string;
  matchId: string;
  userId: string;
  taskText: string;
  review: ReviewFeedback;
}

export interface StartMatchResponse {
  lobbyStart: LobbyStartPayload;
  matchInitialization: MatchInitializationResponse;
}

export interface CommitSubmitPayload {
  matchId: string;
  userId: string;
  commitHash: string;
  message: string;
  diffText: string;
}

export interface CommitReviewPayload {
  matchId: string;
  commitId: string;
  reviewerUserId: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface VoteCastPayload {
  matchId: string;
  meetingId: string;
  voterUserId: string;
  targetUserId: string | null;
}

export interface MeetingStartPayload {
  matchId: string;
  triggeredByUserId: string;
  reason: string;
}

export interface RecapPayload {
  matchId: string;
  winnerTeam: string;
  endingReason: string;
  summary: string;
  learningRecap: string;
}

export interface SocketEventMap {
  'player:connected': { userId: string };
  'player:joined': { lobbyId: string; userId: string };
  'player:left': { lobbyId: string; userId: string };
  'match:started': MatchInitializationResponse;
  'role:assigned': MatchPlayerRole;
  'task:assigned': MatchTaskDto;
  'submission:reviewed': TaskSubmissionResponse;
}
