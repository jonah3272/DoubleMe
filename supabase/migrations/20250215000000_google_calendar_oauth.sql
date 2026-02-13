-- Google Calendar OAuth: per-user tokens and PKCE pending state.
create table if not exists public.google_calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists google_calendar_tokens_user_id_idx on public.google_calendar_tokens(user_id);

alter table public.google_calendar_tokens enable row level security;

create policy "Users can manage own google_calendar_tokens"
  on public.google_calendar_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Pending state for OAuth callback (state -> code_verifier, user_id, optional return_path).
create table if not exists public.google_oauth_pending (
  state text primary key,
  code_verifier text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  return_path text,
  created_at timestamptz not null default now()
);

alter table public.google_oauth_pending enable row level security;
