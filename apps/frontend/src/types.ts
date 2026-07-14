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
  match: {
    id: string;
    lobbyId: string;
    status: string;
    startedAt: string | null;
    endedAt: string | null;
    shipReadiness: number;
    timerSecondsRemaining: number;
    roleAssignments: Record<string, 'crew' | 'imposter' | 'support'>;
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
}

export interface MatchInitializationResponse {
  match: MatchStateDto['match'];
  roleAssignments: Record<string, 'crew' | 'imposter' | 'support'>;
  tasks: MatchTaskDto[];
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