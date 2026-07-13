-- Game Engine Service migration
-- Owns: matches, tasks, player_tasks, commits, meetings, votes, match_results

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references lobbies(id) on delete restrict,
  status text not null default 'active',
  started_at timestamptz default now(),
  ended_at timestamptz,
  ship_readiness integer not null default 0,
  timer_seconds_remaining integer not null default 0,
  role_assignments jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  title text not null,
  description text not null,
  difficulty text not null,
  status text not null default 'todo',
  is_sabotage boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists player_tasks (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint player_tasks_match_task_user_unique unique (match_id, task_id, user_id)
);

create table if not exists commits (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  commit_hash text not null,
  message text not null,
  diff_text text not null,
  review_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  triggered_by_user_id uuid not null references users(id) on delete cascade,
  reason text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  voter_user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint votes_meeting_voter_unique unique (meeting_id, voter_user_id)
);

create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references matches(id) on delete cascade,
  winner_team text not null,
  ending_reason text not null,
  summary text not null,
  learning_recap text not null,
  created_at timestamptz not null default now()
);