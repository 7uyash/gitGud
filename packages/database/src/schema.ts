import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  githubId: text('github_id').unique(),
  googleId: text('google_id').unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  username: text('username').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const lobbies = pgTable('lobbies', {
  id: uuid('id').defaultRandom().primaryKey(),
  hostUserId: uuid('host_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('open'),
  maxPlayers: integer('max_players').notNull().default(8),
  joinCode: text('join_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const lobbyPlayers = pgTable(
  'lobby_players',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    lobbyId: uuid('lobby_id').notNull().references(() => lobbies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    isReady: boolean('is_ready').notNull().default(false),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    lobbyUserUnique: uniqueIndex('lobby_players_lobby_user_unique').on(table.lobbyId, table.userId),
  }),
);

export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  lobbyId: uuid('lobby_id').notNull().references(() => lobbies.id, { onDelete: 'restrict' }),
  status: text('status').notNull().default('active'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  shipReadiness: integer('ship_readiness').notNull().default(0),
  timerSecondsRemaining: integer('timer_seconds_remaining').notNull().default(0),
  roleAssignments: jsonb('role_assignments').notNull().default({}),
  currentRound: integer('current_round').notNull().default(1),
  difficultyTrend: text('difficulty_trend').notNull().default('normal'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  difficulty: text('difficulty').notNull(),
  status: text('status').notNull().default('todo'),
  isSabotage: boolean('is_sabotage').notNull().default(false),
  expectedSolution: text('expected_solution'),
  codeSnippet: text('code_snippet'),
  aiMetadata: jsonb('ai_metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const playerTasks = pgTable(
  'player_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    playerTaskUnique: uniqueIndex('player_tasks_match_task_user_unique').on(table.matchId, table.taskId, table.userId),
  }),
);

export const commits = pgTable('commits', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  commitHash: text('commit_hash').notNull(),
  message: text('message').notNull(),
  diffText: text('diff_text').notNull(),
  reviewStatus: text('review_status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const meetings = pgTable('meetings', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  triggeredByUserId: uuid('triggered_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meetingId: uuid('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    voterUserId: uuid('voter_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    oneVotePerMeeting: uniqueIndex('votes_meeting_voter_unique').on(table.meetingId, table.voterUserId),
  }),
);

export const matchResults = pgTable(
  'match_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    winnerTeam: text('winner_team').notNull(),
    endingReason: text('ending_reason').notNull(),
    summary: text('summary').notNull(),
    learningRecap: text('learning_recap').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    matchUnique: uniqueIndex('match_results_match_unique').on(table.matchId),
  }),
);

export const matchEvents = pgTable('match_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const schema = {
  users,
  lobbies,
  lobbyPlayers,
  matches,
  tasks,
  playerTasks,
  commits,
  meetings,
  votes,
  matchResults,
  matchEvents,
};

export type MatchRoleAssignments = Record<string, string>;
