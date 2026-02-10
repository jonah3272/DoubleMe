# Product Definition: Personal Project OS

## 1. Product Definition

**Personal Project OS** is a single-user web application that serves as the primary surface for thinking, planning, and executing across multiple long-running projects. It is built for **you**—someone who runs several projects in parallel and needs one place where context, decisions, and work-in-progress persist and compound instead of scattering across chats, notes, and tools. It solves the problem of **context loss and session amnesia**: existing AI tools treat each conversation as disposable, force you to re-explain projects and priorities, and don’t tie conversations to durable artifacts or a shared memory you control. This product keeps project context, conversation history, and generated artifacts in one place, under your control, so you can resume and deepen work instead of starting over.

---

## 2. Core User Loop

- **Entry:** You open the app (bookmark or default tab). You land on a **home/dashboard** that shows your active projects and, optionally, a single “focus” or “today” strip (e.g., one project or one thread to continue).
- **First view:** You see a minimal list of projects and recent activity—last updated, recent threads or artifacts—so you can choose “continue here” or “start here” with minimal scanning.
- **Interacting with a project:** Selecting a project opens its space: a project-scoped view where you see threads (conversations), artifacts (notes, plans, summaries), and any project-level memory you’ve chosen to keep. You think and plan via conversation; you can ask to create or update artifacts (e.g., “turn this into a one-pager” or “update the roadmap”). Actions are explicit: you trigger planning, summarization, or updates; the system doesn’t act in the background without your intent.
- **Accumulation over time:** Each project accumulates: conversations stay in that project; artifacts are stored and versioned or overwritten by choice; memory (facts, decisions, constraints) is explicitly added or edited by you. Threads can reference artifacts and memory so that later sessions build on prior work.
- **Compounding value:** The system’s value grows because (1) you don’t re-explain the same project repeatedly, (2) artifacts become the source of truth you can refine over time, and (3) memory keeps priorities and constraints so behavior stays consistent and predictable. Sessions extend previous sessions instead of resetting.

---

## 3. Non-Goals (Explicit)

- **Generic chatbot replacement** — It is not meant to replace ad-hoc Q&A or one-off chats elsewhere; it is for project-scoped, persistent work.
- **Fully autonomous agents** — No agents that run without your explicit invocation or that take multi-step actions you didn’t trigger.
- **Background automation without user intent** — Nothing runs on a schedule or in the background unless you explicitly set it (e.g., “remind me” or “run this weekly” by choice).
- **Massive integration surface area** — Integrations (e.g., calendar, email, other tools) are out of scope unless they directly support the core loop (think, plan, execute within projects). No “integrate everything.”
- **Fancy visuals at the expense of speed** — No heavy animations, decorative graphics, or UI that slows down loading or interaction. No icons anywhere in the UI.
- **Demo or playground** — It is not a showcase for AI capabilities or an automation experiment; it is a daily driver for real work.
- **Multi-tenant or team product** — It is for a single user (you); no sharing, teams, or collaboration features in scope.

---

## 4. Design Principles

1. **Premium but calm UI** — Typography, spacing, and contrast feel considered and readable; no clutter, no noisy patterns. The interface feels solid and focused, not flashy.
2. **Speed over cleverness** — Fast load, fast navigation, fast responses. Prefer simple, predictable implementations over “smart” or complex behavior that could slow or confuse.
3. **User-controlled memory** — Memory (facts, decisions, constraints per project or global) is visible and editable by you. The system does not auto-write memory without your approval or clear action.
4. **Deterministic behavior** — Actions have predictable outcomes. No surprise side effects; if something runs, it’s because you triggered it with clear intent.
5. **Low cognitive load** — Few concepts, few screens. Getting to “continue working” or “capture this” should take minimal steps and decisions.
6. **Cheap to run** — Architecture and usage (e.g., model calls, storage, MCP usage) should stay low-cost so the product is sustainable for long-term personal use.
7. **Explicit over implicit** — Prefer clear buttons and commands over magic behavior. You decide when to save, when to summarize, when to call an external tool.

---

## 5. Technical Constraints

- **Web app with modern, boring tech** — A standard web stack (e.g., React/Next.js or equivalent), TypeScript, and well-understood patterns. No exotic or experimental frameworks for core UI or API.
- **Supabase for auth and persistence** — Authentication and all persistent data (projects, threads, artifacts, memory) live in Supabase. No second database or auth system for core data.
- **Clear separation of concerns** — UI (front end), server/API logic (e.g., route handlers, orchestration), and MCP layer are clearly separated. MCP is invoked from server logic only where it adds real value.
- **MCP only where it provides real leverage** — MCP is used for capabilities that are hard or wasteful to reimplement (e.g., search, docs, specific tools). It is not used for generic CRUD or for “because we can” features.
- **No secrets hardcoded** — All secrets (API keys, Supabase keys, etc.) come from environment variables or a secure config path. No keys in repo or client bundles.
- **No icons in the UI** — No icon fonts, icon libraries, or decorative icons. Text, spacing, and typography only.

---

## 6. Success Criteria

After one month of daily use, “good” looks like:

- **What you rely on it for:** You open it first when you want to think through a project, update a plan, or capture a decision. You use it as the place where project context lives and where you resume work instead of re-explaining.
- **What you stop using because of it:** You use other tools less for “remember what we decided” or “what’s the current plan?”—because those live in Project OS and are easy to find and update.
- **What would disappoint you if it broke:** Losing project-scoped threads and artifacts, or losing control over memory (e.g., wrong or stale facts driving behavior). Slow or flaky load would also be disappointing given the “speed over cleverness” principle.

---

## How the Stack Supports This Vision

- **Web app:** The UI is the only place you interact with the product. It enforces the core loop (projects → threads → artifacts → memory) with minimal navigation and a calm, premium-but-fast experience. It stays thin: it renders state, sends intent to the server, and displays results. No business logic or secrets in the client.
- **Supabase:** Auth gives you a single identity and secure access. Persistence holds projects, threads, artifacts, and memory in one place, with clear schema and RLS so only you can read/write your data. Supabase keeps the system cheap (managed Postgres + auth) and avoids custom backend infra. Long-term, backups and portability align with “user-controlled” and “cheap to run.”
- **MCP server:** Used only where it adds leverage the app shouldn’t reimplement (e.g., fetching docs, search, or specialized tools). The app stays focused on project OS behavior; MCP extends capability without bloating the codebase. Clear separation (UI → server → MCP) keeps behavior deterministic and makes it obvious when and why external tools are called—supporting “explicit over implicit” and “cheap to run” by limiting unnecessary calls.
