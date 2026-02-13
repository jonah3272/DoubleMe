# Personal Project OS (DoubleMe)

Monorepo for the Personal Project OS: think, plan, and execute across multiple long-running projects.

## Repo layout

- **apps/web** — Next.js App Router (UI, auth, data access, LLM)
- **apps/mcp** — Node.js TypeScript MCP server (Cursor tools)
- **packages/shared** — Shared types and helpers
- **docs** — Product and architecture

## Prerequisites

- **Node.js >= 20** (includes `npm`)

## Setup

**Option A — with pnpm (recommended):**
```bash
pnpm install
```

**Option B — without pnpm (Node + npm only):**
```bash
cd apps/web
npm install
cd ../..
```

Configure env per app (see each app’s `.env*.example`). Do not commit files that contain real values.

## Run the app locally

**If you have pnpm:** from repo root run `pnpm dev`.

**If pnpm is not recognized**, use Node and npm only:

1. **One-time:** install dependencies (from repo root):
   ```bash
   cd apps/web
   npm install
   cd ../..
   ```
2. **Start the app** (from repo root):
   ```bash
   node run-web.js
   ```
   Or from the web app folder:
   ```bash
   cd apps/web
   npm run dev
   ```

Then open **http://localhost:3000** in your browser.

**Local testing without Supabase:** From repo root run **`node run-local.js`**. It installs dependencies in `apps/web` if needed, then starts the dev server. Open **http://localhost:3000** — with no `.env.local` you'll be redirected to the preview (mock data). No database or env required.

### Can't see it locally?

1. **Install dependencies** (from repo root):
   ```bash
   pnpm install
   ```
   If you don't have pnpm: `npm install` inside `apps/web` (then run from there with `npm run dev`).

2. **Env for the web app** — create `apps/web/.env.local` (copy from `apps/web/.env.local.example`). At minimum you need Supabase so auth works:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.
   - Optional dev shortcut: set `AUTH_BYPASS=true`, `BYPASS_USER_ID=<uuid>`, and `BYPASS_EMAIL=...` (and `SUPABASE_SERVICE_ROLE_KEY`) to skip login; see the example file.
   - **Vercel:** set the same variables in the project’s **Settings → Environment Variables** (e.g. `KIMI_API_KEY` for Import from Granola); then redeploy.

3. **Start the server** (from repo root):
   ```bash
   pnpm dev
   ```
   Or without pnpm: `node run-web.js` (requires `apps/web/node_modules` to exist), or `cd apps/web && npm run dev`.

4. **Open the app** — go to **http://localhost:3000**. If the page is blank or errors, check the terminal for build/runtime errors. If port 3000 is in use, Next.js will print an alternate port (e.g. 3001).

5. **"Internal Server Error" or 500** — Usually missing or invalid env. Check the **terminal** where `pnpm dev` is running for the real error. Ensure `apps/web/.env.local` exists with at least:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase project settings).
   - If using `AUTH_BYPASS=true`, also set `SUPABASE_SERVICE_ROLE_KEY` and `BYPASS_USER_ID`.
   You can confirm env is loaded by opening **http://localhost:3000/api/env-check** (run the dev server first).

## Dev commands

| Command | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js dev server (apps/web) |
| `pnpm dev:web` | Same as `pnpm dev` |
| `pnpm dev:mcp` | Start MCP server for Cursor (apps/mcp) |
| `pnpm build` | Build all workspaces |
| `pnpm build:web` | Build web app only |
| `pnpm build:mcp` | Build MCP server only |
| `pnpm lint` | Lint all workspaces |
| `pnpm -F web screenshots` | Capture app screenshots (dev server must be running) |
| `pnpm -F web playwright:install` | Install Playwright Chromium (run once before first screenshots) |

**Screenshots:** First time, run `pnpm -F web playwright:install`. Then start the app (`pnpm dev`) and in another terminal run `pnpm -F web screenshots`. Screenshots are written to `apps/web/screenshots/` (home, login, ui, projects).

## MCP server (Cursor)

To use the DoubleMe MCP server in Cursor:

1. Start the server: `pnpm dev:mcp` (or leave it running in a terminal).
2. Add the server in Cursor: **Settings → MCP → Add server** (or edit your MCP config).
3. Use a **stdio** server with:
   - **Command:** `pnpm`
   - **Args:** `run` `dev:mcp`
   - **Cwd:** this repo’s root (the folder containing `package.json`).

If Cursor supports a project-level MCP config file (e.g. `.cursor/mcp.json`), one is included so the server can be picked up when the workspace is open.

## Docs

- [Product definition](docs/product.md)
- [Architecture](docs/architecture.md)
