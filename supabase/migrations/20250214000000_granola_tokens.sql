-- Per-user Granola OAuth tokens for MCP (like Claude/ChatGPT connector).
-- RLS: users can only read/update/delete their own row.
create table if not exists public.granola_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists granola_tokens_user_id_idx on public.granola_tokens(user_id);

alter table public.granola_tokens enable row level security;

create policy "Users can manage own granola_tokens"
  on public.granola_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
