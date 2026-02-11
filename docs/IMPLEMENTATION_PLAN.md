# DoubleMe Dashboard – Implementation Plan

Make every dashboard card (Activity, Tasks, Calendar, Teammates, Design, Chat) **working**, **fast**, and **modern**. This plan is phased so you can ship incrementally.

---

## Principles

- **Output on dashboard, configuration in Settings** – Dashboard shows live data; connecting/editing happens in Settings or dedicated pages.
- **Fast** – Server components + selective client interactivity; list pages use cursor pagination or “load more”; avoid N+1.
- **Modern** – Consistent tokens (you have these), clear hierarchy, loading/empty states, no layout shift.

---

## Phase 1: Foundation (Activity + Tasks + Teammates)

**Goal:** Three cards show real data and full CRUD. No external APIs yet.

### 1.1 Teammates (Contacts) – Settings

- **Where:** `Settings` → Teammates section (or `/projects/[id]/settings` with `#teammates`).
- **Backend:** Already have `contacts` table (project_id, name, email, role, notes). RLS and admin policies exist.
- **Implement:**
  - **List** – Server component: fetch contacts for project, display table or card list (name, email, role).
  - **Add** – Client: modal or inline form (name required, email/role/notes optional). Server action: `insert into contacts`, revalidate.
  - **Edit** – Inline or modal: update name, email, role, notes. Server action: `update contacts where id`.
  - **Delete** – Button + confirm; server action: `delete from contacts where id`.
- **Dashboard:** “Teammates” card already shows count; “Manage in Settings” links to Settings. Optional: show last 3 names on card.

**Effort:** Small. **Enables:** Task assignees.

---

### 1.2 Tasks – Full CRUD + List Page

- **Where:** Dashboard card + `/projects/[id]/tasks` page.
- **Backend:** `tasks` table (project_id, title, status, assignee_id→contacts, due_at, notes). RLS exists.
- **Implement:**
  - **Tasks page:**
    - Server: fetch tasks for project (order by updated_at desc), include `assignee: contacts(name)`.
    - UI: List or simple kanban (Todo | In progress | Done). Each row: title, status, assignee, due date, actions (edit, delete).
    - **Add task** – Form: title, status (default todo), assignee (dropdown from contacts), due_at, notes. Server action: insert.
    - **Edit task** – Inline or modal: same fields. Server action: update.
    - **Delete** – With confirm. Server action: delete.
  - **Dashboard card:** Show count (done). Optionally: “Next 3 tasks” (todo or in_progress, due soon) with links to tasks page.

**Effort:** Medium. **Depends on:** Teammates for assignee dropdown.

---

### 1.3 Activity (Threads + Artifacts)

- **Where:** Dashboard card + `/projects/[id]/threads` page; artifacts can live inside a thread or as standalone.
- **Backend:** `conversations`, `messages`, `artifacts` (with `artifact_type`, `occurred_at`). RLS exists.
- **Implement:**
  - **Threads page:**
    - List conversations for project (title or “Thread from &lt;date&gt;”, updated_at). Link to thread detail.
    - **New thread** – Create conversation, redirect to thread detail where user can add messages.
  - **Thread detail** (`/projects/[id]/threads/[threadId]`):
    - Show messages (user / assistant / system). For now: manual “Add message” (user content only) + store in `messages`. Later: hook up AI (BYOK).
    - Optional: “Save as artifact” → create artifact from last assistant message or selection.
  - **Artifacts:**
    - List artifacts for project (title, type, updated_at) on threads page or separate “Artifacts” tab.
    - Create: title, body, artifact_type (note | meeting_summary | plan | design), optional occurred_at. Server action: insert.
    - Edit/delete: standard CRUD.
  - **Dashboard card:** Show counts (done). Optionally: “Latest thread” and “Latest artifact” with titles and links.

**Effort:** Medium–large. **Enables:** Meeting notes (as artifacts with type `meeting_summary`) and future AI threads.

---

## Phase 2: Integrations (Calendar + Design)

**Goal:** Calendar and Design cards show real data from external services.

### 2.1 Calendar

- **Options:**
  - **A – OAuth + sync:** User connects Google or Microsoft in Settings; backend syncs events into your DB; dashboard reads from DB. Best for “fast” and “output here.”
  - **B – Embed:** If Google/Microsoft allow iframe embeds for calendar view, embed in dashboard. Often restricted by CSP.
- **Recommended: A (sync to DB).**
  - **Settings:** “Connect Calendar” → OAuth (Google Calendar API or Microsoft Graph). Store refresh_token (encrypted) per user or per project in `project_agents.config` or a dedicated `integrations` table.
  - **Sync:** Cron (e.g. Vercel Cron or Edge) or webhook: fetch events for next 7–14 days, write to `calendar_events` table (project_id, external_id, title, start, end, link, source). Upsert by external_id.
  - **Schema:** New migration: `calendar_events` (id, project_id, source, external_id, title, start_at, end_at, link, raw jsonb, created_at). RLS: same as projects.
  - **Dashboard card:** Query `calendar_events` where project_id, start_at >= now(), order by start_at, limit 5. Show “Today” / “This week” with links to open in Google/Outlook.

**Effort:** Large (OAuth, tokens, sync job). **Optional:** Start with “Add event” manual form that writes to `calendar_events` so the card isn’t empty; replace with real sync later.

---

### 2.2 Design (Figma)

- **Options:**
  - **A – Links + metadata:** User pastes Figma file/URL in Settings. You store link; optionally fetch title/thumbnail via Figma API (read-only token). Dashboard shows “Recent Figma files” with links.
  - **B – Figma embed:** Official Figma embed (iframe) for a specific file. User adds file URL; dashboard shows embed. No auth needed for public files.
- **Recommended: A for list, B for “preview” when user clicks.**
  - **Settings:** “Add Figma file” – input URL, optional Figma API token for private files. Save to `figma_links` or `artifacts` with type `design` + metadata (url, file_key, name).
  - **Dashboard card:** List last 5 Figma links (name, “Open in Figma”). Optional: thumbnail from Figma API.
  - **Schema:** Either `artifacts` with artifact_type=design and a `link`/`metadata` column, or new table `figma_links` (project_id, url, file_key, name, thumbnail_url).

**Effort:** Medium (links + optional API). **Fast path:** Just store URLs and show list; add API later for names/thumbnails.

---

## Phase 3: Chat & AI (Optional)

- **Chat card:** Already works (Open ChatGPT in new tab). No change required.
- **Optional – In-app chat with BYOK:**
  - Settings: “OpenAI API key” (optional). Store encrypted per user.
  - Thread detail: When user sends a message, if key exists, call OpenAI API (or Anthropic), append assistant message to `messages`, stream or not. Activity stays in your DB; billing on user’s key.

**Effort:** Medium. Can stay “Open ChatGPT” only if you prefer.

---

## Phase 4: Polish – Fast & Modern

### Performance

- **Server components** for lists and dashboard counts; avoid client fetch for initial load.
- **Pagination:** Tasks and threads – “Load more” or cursor-based (e.g. `updated_at < last` limit 20).
- **Dashboard:** Single server component that runs 4–6 count/summary queries in parallel (already done for counts); add one query per new feature (e.g. next 5 events, next 3 tasks).
- **Caching:** Consider `unstable_cache` or short revalidate for dashboard if data is okay to be a few seconds stale.

### UI/UX

- **Loading:** Skeleton for dashboard cards and list pages (you have Skeleton component).
- **Empty states:** Every card and list has a clear empty state + primary action (e.g. “Add first task”).
- **Responsive:** Grid of cards stacks on small screens (already responsive with `auto-fill`); tables on tasks/threads can scroll or card layout on mobile.
- **Accessibility:** Labels, focus states, aria where needed (buttons and links already in place).

### Consistency

- Reuse existing tokens (globals.css), Card, Button, Input, Dialog. Add a **Badge** or **Pill** for status (task status, artifact type) if missing.
- Same pattern for all “Add / Edit” flows: Server action + `revalidatePath` (and optional `router.refresh()` on client).

---

## Suggested Order of Implementation

| Order | Item                    | Delivers                                           |
|-------|-------------------------|----------------------------------------------------|
| 1     | Teammates CRUD (Settings) | Assignees on tasks, “Manage in Settings” works    |
| 2     | Tasks full CRUD + page  | Tasks card and page fully working                 |
| 3     | Threads list + detail   | Activity card and “View threads” working          |
| 4     | Artifacts CRUD          | Meeting notes / plans as artifacts                 |
| 5     | Dashboard card tweaks   | “Next 3 tasks”, “Latest thread” on cards          |
| 6     | Figma links (manual)   | Design card shows saved Figma links               |
| 7     | Calendar (manual or OAuth) | Calendar card shows events                      |
| 8     | Loading/empty polish    | Skeletons, empty states, small UX wins            |

---

## Schema Additions (when needed)

- **Calendar:** `calendar_events` (see 2.1).
- **Figma:** Either extend `artifacts` with `link`/`metadata` for type=design, or `figma_links` table.
- **Integrations:** If you want a single place for tokens: `project_integrations` (project_id, provider, credentials_encrypted, config) or keep using `project_agents.config` for calendar/Figma config.

---

## Summary

- **Phase 1** makes Activity, Tasks, and Teammates fully functional and fast with your current stack and DB.
- **Phase 2** adds real Calendar and Design data via sync or stored links.
- **Phase 3** is optional (in-app BYOK chat).
- **Phase 4** is cross-cutting: performance, loading states, and modern UI polish.

Following this order, you get a working, good-looking dashboard step by step without blocking on OAuth or Figma until you’re ready.
