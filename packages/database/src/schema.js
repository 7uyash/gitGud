"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.matchEvents = exports.matchResults = exports.votes = exports.meetings = exports.commits = exports.playerTasks = exports.tasks = exports.matches = exports.lobbyPlayers = exports.lobbies = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    githubId: (0, pg_core_1.text)('github_id').unique(),
    googleId: (0, pg_core_1.text)('google_id').unique(),
    email: (0, pg_core_1.text)('email').unique(),
    passwordHash: (0, pg_core_1.text)('password_hash'),
    username: (0, pg_core_1.text)('username').notNull(),
    avatarUrl: (0, pg_core_1.text)('avatar_url').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.lobbies = (0, pg_core_1.pgTable)('lobbies', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    hostUserId: (0, pg_core_1.uuid)('host_user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    status: (0, pg_core_1.text)('status').notNull().default('open'),
    maxPlayers: (0, pg_core_1.integer)('max_players').notNull().default(8),
    joinCode: (0, pg_core_1.text)('join_code').notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.lobbyPlayers = (0, pg_core_1.pgTable)('lobby_players', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    lobbyId: (0, pg_core_1.uuid)('lobby_id').notNull().references(() => exports.lobbies.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    isReady: (0, pg_core_1.boolean)('is_ready').notNull().default(false),
    joinedAt: (0, pg_core_1.timestamp)('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    lobbyUserUnique: (0, pg_core_1.uniqueIndex)('lobby_players_lobby_user_unique').on(table.lobbyId, table.userId),
}));
exports.matches = (0, pg_core_1.pgTable)('matches', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    lobbyId: (0, pg_core_1.uuid)('lobby_id').notNull().references(() => exports.lobbies.id, { onDelete: 'restrict' }),
    status: (0, pg_core_1.text)('status').notNull().default('active'),
    startedAt: (0, pg_core_1.timestamp)('started_at', { withTimezone: true }).defaultNow(),
    endedAt: (0, pg_core_1.timestamp)('ended_at', { withTimezone: true }),
    shipReadiness: (0, pg_core_1.integer)('ship_readiness').notNull().default(0),
    timerSecondsRemaining: (0, pg_core_1.integer)('timer_seconds_remaining').notNull().default(0),
    roleAssignments: (0, pg_core_1.jsonb)('role_assignments').notNull().default({}),
    currentRound: (0, pg_core_1.integer)('current_round').notNull().default(1),
    difficultyTrend: (0, pg_core_1.text)('difficulty_trend').notNull().default('normal'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.tasks = (0, pg_core_1.pgTable)('tasks', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    matchId: (0, pg_core_1.uuid)('match_id').notNull().references(() => exports.matches.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    difficulty: (0, pg_core_1.text)('difficulty').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('todo'),
    isSabotage: (0, pg_core_1.boolean)('is_sabotage').notNull().default(false),
    expectedSolution: (0, pg_core_1.text)('expected_solution'),
    codeSnippet: (0, pg_core_1.text)('code_snippet'),
    aiMetadata: (0, pg_core_1.jsonb)('ai_metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.playerTasks = (0, pg_core_1.pgTable)('player_tasks', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    matchId: (0, pg_core_1.uuid)('match_id').notNull().references(() => exports.matches.id, { onDelete: 'cascade' }),
    taskId: (0, pg_core_1.uuid)('task_id').notNull().references(() => exports.tasks.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    assignedAt: (0, pg_core_1.timestamp)('assigned_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
}, (table) => ({
    playerTaskUnique: (0, pg_core_1.uniqueIndex)('player_tasks_match_task_user_unique').on(table.matchId, table.taskId, table.userId),
}));
exports.commits = (0, pg_core_1.pgTable)('commits', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    matchId: (0, pg_core_1.uuid)('match_id').notNull().references(() => exports.matches.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    commitHash: (0, pg_core_1.text)('commit_hash').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    diffText: (0, pg_core_1.text)('diff_text').notNull(),
    reviewStatus: (0, pg_core_1.text)('review_status').notNull().default('pending'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.meetings = (0, pg_core_1.pgTable)('meetings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    matchId: (0, pg_core_1.uuid)('match_id').notNull().references(() => exports.matches.id, { onDelete: 'cascade' }),
    triggeredByUserId: (0, pg_core_1.uuid)('triggered_by_user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    reason: (0, pg_core_1.text)('reason').notNull(),
    startedAt: (0, pg_core_1.timestamp)('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: (0, pg_core_1.timestamp)('ended_at', { withTimezone: true }),
});
exports.votes = (0, pg_core_1.pgTable)('votes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    meetingId: (0, pg_core_1.uuid)('meeting_id').notNull().references(() => exports.meetings.id, { onDelete: 'cascade' }),
    matchId: (0, pg_core_1.uuid)('match_id').notNull().references(() => exports.matches.id, { onDelete: 'cascade' }),
    voterUserId: (0, pg_core_1.uuid)('voter_user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    targetUserId: (0, pg_core_1.uuid)('target_user_id').references(() => exports.users.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    oneVotePerMeeting: (0, pg_core_1.uniqueIndex)('votes_meeting_voter_unique').on(table.meetingId, table.voterUserId),
}));
exports.matchResults = (0, pg_core_1.pgTable)('match_results', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    matchId: (0, pg_core_1.uuid)('match_id').notNull().references(() => exports.matches.id, { onDelete: 'cascade' }),
    winnerTeam: (0, pg_core_1.text)('winner_team').notNull(),
    endingReason: (0, pg_core_1.text)('ending_reason').notNull(),
    summary: (0, pg_core_1.text)('summary').notNull(),
    learningRecap: (0, pg_core_1.text)('learning_recap').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    matchUnique: (0, pg_core_1.uniqueIndex)('match_results_match_unique').on(table.matchId),
}));
exports.matchEvents = (0, pg_core_1.pgTable)('match_events', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    matchId: (0, pg_core_1.uuid)('match_id').notNull().references(() => exports.matches.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'set null' }),
    eventType: (0, pg_core_1.text)('event_type').notNull(),
    payload: (0, pg_core_1.jsonb)('payload').notNull().default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
exports.schema = {
    users: exports.users,
    lobbies: exports.lobbies,
    lobbyPlayers: exports.lobbyPlayers,
    matches: exports.matches,
    tasks: exports.tasks,
    playerTasks: exports.playerTasks,
    commits: exports.commits,
    meetings: exports.meetings,
    votes: exports.votes,
    matchResults: exports.matchResults,
    matchEvents: exports.matchEvents,
};
