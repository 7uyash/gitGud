-- Auth & Lobby Service migration
-- Owns: users, lobbies, lobby_players

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  github_id text not null unique,
  username text not null,
  avatar_url text not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists lobbies (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references users(id) on delete cascade,
  status text not null default 'open',
  max_players integer not null default 8,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists lobby_players (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references lobbies(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  constraint lobby_players_lobby_user_unique unique (lobby_id, user_id)
);