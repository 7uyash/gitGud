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
