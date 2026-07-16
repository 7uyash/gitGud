export type GameRole = 'crew' | 'imposter' | 'support';

export interface JwtClaims {
  userId: string;
  username: string;
}

export interface MatchPlayerRole {
  userId: string;
  role: GameRole;
}

export interface MatchInitializationPayload {
  lobbyId: string;
  playerIds: string[];
  timerSeconds: number;
}

export interface MatchInitializationResponse {
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
  roleAssignments: Record<string, GameRole>;
  tasks: MatchTaskDto[];
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

export interface MatchStateDto {
  match: MatchInitializationResponse['match'];
  result: MatchResultDto | null;
  tasks: MatchTaskDto[];
  players: {
    userId: string;
    username: string;
  }[];
  myTaskId?: string;
}

export interface MatchResultDto {
  id: string;
  matchId: string;
  winnerTeam: string;
  endingReason: string;
  summary: string;
  learningRecap: string;
  createdAt: string;
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

export interface MeetingStartPayload {
  matchId: string;
  triggeredByUserId: string;
  reason: string;
}

export interface VoteCastPayload {
  matchId: string;
  meetingId: string;
  voterUserId: string;
  targetUserId: string | null;
}

export interface ReviewFeedback {
  status: 'PASS' | 'NEEDS_WORK';
  score: number;
  feedback: string;
}

export interface TaskSubmissionPayload {
  matchId: string;
  userId: string;
  taskText: string;
}

export interface TaskSubmissionResponse {
  submissionId: string;
  matchId: string;
  userId: string;
  taskText: string;
  review: ReviewFeedback;
}