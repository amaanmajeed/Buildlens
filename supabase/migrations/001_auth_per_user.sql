-- BuildLens auth + per-user workspace (run in Supabase SQL editor after schema.sql)
-- Wipes existing MVP workspace rows that have no user_id (safe for empty/demo data).

-- Profiles (1:1 with auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  preferred_model text not null default 'gpt-4o-mini',
  openai_api_key_ciphertext text,
  openai_api_key_last4 text,
  theme text,
  last_project_id int,
  last_file_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clear orphan MVP rows before adding NOT NULL user_id
truncate table file_chats;
truncate table workspace_snapshots;
truncate table estimate_drafts;
truncate table file_search_docs;

-- file_search_docs
alter table file_search_docs drop constraint if exists file_search_docs_file_key_key;
alter table file_search_docs
  add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table file_search_docs alter column user_id set not null;
create unique index if not exists file_search_docs_user_file_key_uidx
  on file_search_docs (user_id, file_key);

-- workspace_snapshots
alter table workspace_snapshots drop constraint if exists workspace_snapshots_file_key_key;
alter table workspace_snapshots
  add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table workspace_snapshots alter column user_id set not null;
create unique index if not exists workspace_snapshots_user_file_key_uidx
  on workspace_snapshots (user_id, file_key);

-- estimate_drafts: recreate PK as (user_id, project_id)
alter table estimate_drafts
  add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table estimate_drafts drop constraint if exists estimate_drafts_pkey;
alter table estimate_drafts alter column user_id set not null;
alter table estimate_drafts
  add primary key (user_id, project_id);

-- file_chats
alter table file_chats
  add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table file_chats alter column user_id set not null;
create index if not exists file_chats_user_file_key_idx
  on file_chats (user_id, file_key);

-- user_projects (My Work)
create table if not exists user_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id int not null,
  project_title text not null,
  project_meta jsonb not null default '{}'::jsonb,
  files jsonb not null default '[]'::jsonb,
  last_opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create index if not exists user_projects_user_opened_idx
  on user_projects (user_id, last_opened_at desc);

-- RLS
alter table profiles enable row level security;
alter table file_search_docs enable row level security;
alter table workspace_snapshots enable row level security;
alter table estimate_drafts enable row level security;
alter table file_chats enable row level security;
alter table user_projects enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "file_search_docs_all_own" on file_search_docs;
drop policy if exists "workspace_snapshots_all_own" on workspace_snapshots;
drop policy if exists "estimate_drafts_all_own" on estimate_drafts;
drop policy if exists "file_chats_all_own" on file_chats;
drop policy if exists "user_projects_all_own" on user_projects;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

create policy "file_search_docs_all_own" on file_search_docs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workspace_snapshots_all_own" on workspace_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "estimate_drafts_all_own" on estimate_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "file_chats_all_own" on file_chats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_projects_all_own" on user_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
