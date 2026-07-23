create extension if not exists pgcrypto;

create table if not exists public.macroboard_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  name text not null default 'Duo Queue',
  owner_token text not null,
  status text not null default 'active' check (status in ('active','ended','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours'),
  shared_state jsonb not null default '{}'::jsonb,
  game_data jsonb,
  active_preset jsonb
);
create table if not exists public.macroboard_members (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.macroboard_sessions(id) on delete cascade,
  display_name text not null,
  member_token text not null unique,
  role text not null check (role in ('support','heimer','spectator','connector')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.macroboard_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.macroboard_sessions(id) on delete cascade,
  source text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  game_time_seconds integer,
  created_at timestamptz not null default now()
);
create index if not exists macroboard_events_session_created_idx on public.macroboard_events(session_id, created_at desc);
create index if not exists macroboard_members_session_idx on public.macroboard_members(session_id);

alter table public.macroboard_sessions enable row level security;
alter table public.macroboard_members enable row level security;
alter table public.macroboard_events enable row level security;

-- MVP transport policies. Session/member tokens are application-level capabilities.
-- Harden with authenticated users or signed RPCs before a public production release.
create policy "mvp sessions read" on public.macroboard_sessions for select to anon using (expires_at > now());
create policy "mvp sessions create" on public.macroboard_sessions for insert to anon with check (expires_at <= now() + interval '12 hours 5 minutes');
create policy "mvp sessions update" on public.macroboard_sessions for update to anon using (expires_at > now()) with check (expires_at > now());
create policy "mvp members read" on public.macroboard_members for select to anon using (true);
create policy "mvp members create" on public.macroboard_members for insert to anon with check (true);
create policy "mvp members update" on public.macroboard_members for update to anon using (true);
create policy "mvp events read" on public.macroboard_events for select to anon using (true);
create policy "mvp events create" on public.macroboard_events for insert to anon with check (true);

alter publication supabase_realtime add table public.macroboard_sessions;
