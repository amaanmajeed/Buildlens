-- BuildLens: File Search IDs + workspace persistence
-- Run in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists file_search_docs (
  id uuid primary key default gen_random_uuid(),
  file_key text not null unique,
  project_id int not null,
  project_title text not null,
  file_name text not null,
  store_name text not null,
  document_name text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists file_search_docs_project_id_idx
  on file_search_docs (project_id);

create table if not exists workspace_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id int not null,
  file_key text not null unique,
  sov_schedule jsonb not null default '[]'::jsonb,
  plan_takeoff jsonb not null default '[]'::jsonb,
  plan_type text,
  active_chat_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_snapshots_project_id_idx
  on workspace_snapshots (project_id);

create table if not exists estimate_drafts (
  project_id int primary key,
  project_title text,
  estimate_rows jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists file_chats (
  id uuid primary key default gen_random_uuid(),
  file_key text not null,
  title text not null default 'Chat',
  messages jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists file_chats_file_key_idx
  on file_chats (file_key);
