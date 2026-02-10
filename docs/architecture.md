# System Architecture: Personal Project OS

## Overview

The system is a pnpm monorepo with three main parts: a Next.js web app (UI + API), a Node.js MCP server (Cursor tools), and a shared package (types and helpers). Supabase provides auth, persistence, and RLS. All configuration is env-based; no secrets in code or docs.

---

## Monorepo Layout

```
DoubleMe/
├── apps/
│   ├── web/          # Next.js App Router, UI + API + LLM calls
│   └── mcp/          # Node.js TypeScript MCP server (Cursor)
├── packages/
│   └── shared/       # Shared types and helpers
├── docs/
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

- **apps/web** — Next.js App Router, TypeScript. Owns UI, auth (via Supabase client), data access (Supabase client + RLS), and LLM calls. No MCP client in the browser.
- **apps/mcp** — Node.js TypeScript MCP server. Exposes tools for Cursor (e.g. read project state, search artifacts). Uses env for any API or DB access. Runs as a separate process; Cursor connects via stdio or SSE.
- **packages/shared** — Types (e.g. Project, Thread, Artifact, Memory), validation, and pure helpers. Consumed by both `web` and `mcp`. No runtime dependencies on Next or MCP.

---

## Layer Separation

| Layer | Lives in | Responsibility |
|-------|----------|----------------|
| **UI** | apps/web (React, App Router pages/components) | Render state, capture intent, call API routes. No direct Supabase or LLM calls from components; use server actions or route handlers. |
| **API** | apps/web (Route Handlers, Server Actions) | Auth checks, orchestration, Supabase server client, LLM calls. Single place that talks to Supabase and LLM. |
| **MCP** | apps/mcp | Tools for Cursor only. Can call web API (with env URL + key) or read-only Supabase if needed; no business logic duplication. |

Data flow:

- **Browser** → Next.js API/Server Actions → Supabase or LLM.
- **Cursor** → MCP server (stdio/SSE) → MCP tools → (optional) HTTP to web API or Supabase.

The web app never imports MCP. The MCP server never hosts UI. Shared code is types and pure helpers only.

---

## Supabase

- **Auth** — Supabase Auth. Web app uses `@supabase/supabase-js` (browser for session, server for server-side calls). RLS ensures all queries are scoped to the signed-in user.
- **Persistence** — All app data in Supabase Postgres: projects, threads, messages, artifacts, memory. Schema and RLS designed so the web app and (if used) MCP only see data for the authenticated user or service role when intended.
- **RLS** — Every table has RLS policies. The web app uses the user’s JWT; no service role in the browser. MCP, if it talks to Supabase, uses a dedicated role/key and read-only or minimal write where needed.

---

## Configuration

- **Env only** — All URLs, keys, and feature flags come from environment variables. No defaults for secrets; no secrets in repo or in docs.
- **apps/web** — `.env.local` (gitignored). Next.js public vars: `NEXT_PUBLIC_*`. Server-only: Supabase service role (if any), LLM API key, etc.
- **apps/mcp** — `.env` (gitignored). E.g. web API URL, Supabase URL + key if MCP hits DB, or no keys if tools only call web API with a token.
- **Root / docs** — `.env.example` and README describe variable names only; no real values.

---

## MCP Server

- **Role** — Expose a small set of tools to Cursor (e.g. list projects, get thread, search artifacts). Enables Cursor to use project context without opening the web app.
- **Runtime** — Node.js, TypeScript, `@modelcontextprotocol/sdk`. Run with `pnpm dev` (or `tsx src/index.ts`) from `apps/mcp`. Cursor connects via stdio (default) or SSE.
- **Cursor config** — User adds the MCP server in Cursor settings (e.g. `mcp.json` or Cursor UI), pointing to the local `apps/mcp` process. No secrets in that config; MCP reads env at runtime.
- **Boundaries** — MCP does not duplicate auth or business rules. Prefer MCP tools calling the web app’s API (with an env-configured key or token) over MCP talking to Supabase directly, unless a read-only Supabase client is simpler for a specific tool.

---

## UI Rules

- No icons anywhere in the UI (per product definition). Text, spacing, and typography only.
- Premium but calm; speed over cleverness. No heavy assets or animations that hurt load or interaction speed.

---

## Build and Run

- **Install** — From repo root: `pnpm install`.
- **Web** — `pnpm --filter web dev` (or `pnpm -F web dev`). Next.js dev server.
- **MCP** — `pnpm --filter mcp dev` (or `pnpm -F mcp dev`). MCP server for Cursor.
- **Shared** — Built when `web` or `mcp` depend on it; no separate publish. Use TypeScript project references if desired.

See root `README.md` for exact commands and env setup.
