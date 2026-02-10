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
