# Supabase: Schema and RLS

## Overview

Supabase provides auth and the primary database. All tables live in `public`. Row Level Security (RLS) is enabled on every table. Policies are based **strictly on project ownership**: a user can only access data for projects they own (`projects.owner_id = auth.uid()`).

## Environment variables

Set these in `apps/web/.env.local` (never commit real values):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (required).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anonymous (public) key for browser and server session-based access (required).
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for server-only use when RLS must be bypassed (optional; use only when necessary).

The app fails fast at runtime if required env vars are missing.

## Schema

### profiles

One row per authenticated user. Created automatically on signup via trigger.

| Column        | Type      | Description                    |
|---------------|-----------|--------------------------------|
| id            | uuid (PK) | References `auth.users(id)`    |
| display_name  | text      | Optional display name          |
| created_at    | timestamptz | Set on insert                |
| updated_at    | timestamptz | Updated on row update        |

**RLS:** Users can SELECT, UPDATE, and INSERT only their own row (`id = auth.uid()`).

---

### projects

Projects owned by a user. All project-scoped data is keyed by `project_id` and access is via ownership of the project.

| Column      | Type      | Description                |
|-------------|-----------|----------------------------|
| id          | uuid (PK) | Default `gen_random_uuid()` |
| owner_id    | uuid (FK) | References `profiles(id)`  |
| name        | text      | Required                    |
| description | text      | Optional                   |
| created_at  | timestamptz |                          |
| updated_at  | timestamptz |                          |

**RLS:** Users can SELECT, INSERT, UPDATE, DELETE only rows where `owner_id = auth.uid()`.

---

### project_agents

Per-project agent configuration (e.g. enabled tools or settings). One row per `(project_id, agent_key)`.

| Column      | Type      | Description                |
|-------------|-----------|----------------------------|
| id          | uuid (PK) |                            |
| project_id  | uuid (FK) | References `projects(id)`  |
| agent_key   | text      | e.g. `'mcp_tools'`         |
| config      | jsonb     | Default `'{}'`             |
| created_at  | timestamptz |                          |
| updated_at  | timestamptz |                          |

**Unique:** `(project_id, agent_key)`.

**RLS:** Full CRUD only when the current user owns the project (via helper `public.user_owns_project(project_id)`).

---

### conversations

Threads within a project (e.g. chat threads).

| Column      | Type      | Description                |
|-------------|-----------|----------------------------|
| id          | uuid (PK) |                            |
| project_id  | uuid (FK) | References `projects(id)`  |
| title       | text      | Optional                   |
| created_at  | timestamptz |                          |
| updated_at  | timestamptz |                          |

**RLS:** Full CRUD only when the user owns the project (`user_owns_project(project_id)`).

---

### messages

Messages in a conversation. Role is `user`, `assistant`, or `system`.

| Column          | Type      | Description                    |
|-----------------|-----------|--------------------------------|
| id              | uuid (PK) |                                |
| conversation_id | uuid (FK) | References `conversations(id)` |
| role            | text      | `'user' \| 'assistant' \| 'system'` |
| content         | text      | Required                       |
| created_at      | timestamptz |                              |

**RLS:** Full CRUD only when the user owns the project that contains the conversation (ownership resolved via `conversation_id` → `conversations.project_id`).

---

### project_memory

User-controlled key-value memory per project.

| Column      | Type      | Description                |
|-------------|-----------|----------------------------|
| id          | uuid (PK) |                            |
| project_id  | uuid (FK) | References `projects(id)`  |
| key         | text      | Required                   |
| value       | text      | Required                   |
| created_at  | timestamptz |                          |
| updated_at  | timestamptz |                          |

**Unique:** `(project_id, key)`.

**RLS:** Full CRUD only when the user owns the project.

---

### artifacts

Stored artifacts (notes, plans, summaries) per project. Optionally linked to a conversation.

| Column          | Type      | Description                    |
|-----------------|-----------|--------------------------------|
| id              | uuid (PK) |                                |
| project_id      | uuid (FK) | References `projects(id)`      |
| conversation_id | uuid (FK) | Optional, references `conversations(id)` |
| title           | text      | Required                       |
| body            | text      | Default `''`                   |
| created_at      | timestamptz |                              |
| updated_at      | timestamptz |                              |

**RLS:** Full CRUD only when the user owns the project.

---

### audit_logs

Append-only audit trail. Can be scoped to a project or global (`project_id` null).

| Column      | Type      | Description                |
|-------------|-----------|----------------------------|
| id          | uuid (PK) |                            |
| project_id  | uuid (FK) | Optional, references `projects(id)` |
| user_id     | uuid (FK) | References `auth.users(id)` |
| action      | text      | Required                   |
| details     | jsonb     | Default `'{}'`             |
| created_at  | timestamptz |                          |

**RLS:**

- **SELECT:** User can read rows where `user_id = auth.uid()` or where `project_id` is set and the user owns that project.
- **INSERT:** User can insert only rows with `user_id = auth.uid()` and with `project_id` either null or a project they own.
- **UPDATE / DELETE:** No policies (append-only).

---

## RLS helper

- **`public.user_owns_project(project_id uuid) RETURNS boolean`**  
  Returns true if the current user (`auth.uid()`) is the owner of the given project. Implemented as `SECURITY DEFINER` so RLS policies can use it without leaking other rows.

## Client usage

- **Browser:** Use only the **anon** key (e.g. `NEXT_PUBLIC_SUPABASE_ANON_KEY`). The Supabase client uses the user’s session; RLS restricts all access to the current user’s data.
- **Server:** Use the anon key with the user’s session when acting on behalf of that user. Use the **service role** key only when you need to bypass RLS (e.g. admin or background jobs); never expose it to the client.

## Running migrations

Apply migrations via the Supabase CLI or dashboard (SQL editor). Migrations live in `supabase/migrations/` and are applied in order by timestamp.

## Auth (magic link and email/password)

- **Magic link:** User enters email; we call `signInWithOtp`. Supabase sends an email with a link to your app’s callback URL. Configure in Supabase Dashboard → Authentication → URL Configuration:
  - **Site URL:** your app’s origin (e.g. `https://your-app.com` or `http://localhost:3000`)
  - **Redirect URLs:** add `https://your-app.com/auth/callback` and `http://localhost:3000/auth/callback` so the magic link redirects back to the app.
- **Email/password:** `signInWithPassword` and `signUp` use the anon key and RLS; no redirect needed.
- **Route protection:** Middleware refreshes the session and redirects unauthenticated users from `/dashboard` and `/projects` to `/login?next=...`. After sign-in, users are sent to `next` or `/dashboard`.
