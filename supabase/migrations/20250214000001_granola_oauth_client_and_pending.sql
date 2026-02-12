-- Store DCR result: one row with client_id/client_secret for Granola OAuth.
-- Only service role can access (no RLS policies for anon/authenticated).
create table if not exists public.granola_oauth_client (
  id int primary key default 1 check (id = 1),
  client_id text,
  client_secret text,
  updated_at timestamptz default now()
);

alter table public.granola_oauth_client enable row level security;

-- Temporary PKCE state -> code_verifier for OAuth callback (short-lived).
create table if not exists public.granola_oauth_pending (
  state text primary key,
  code_verifier text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.granola_oauth_pending enable row level security;
