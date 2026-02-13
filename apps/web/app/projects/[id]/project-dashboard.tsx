import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { DashboardActivityFeed } from "./dashboard-activity-feed";

const CHATGPT_URL = "https://chat.openai.com";

type NextTask = { id: string; title: string; status: string; due_at: string | null };
type FeedArtifact = { id: string; title: string; updated_at: string };
type UpcomingEvent = { id: string; title: string; start_at: string; end_at: string; link: string | null };
type FigmaLink = { id: string; url: string; name: string };

type DashboardProps = {
  projectId: string;
  projectName: string;
  tasksCount: number;
  contactsCount: number;
  artifactsCount: number;
  nextTasks: NextTask[];
  recentArtifacts: FeedArtifact[];
  upcomingEvents: UpcomingEvent[];
  figmaLinks: FigmaLink[];
};

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatEventTime(start: string) {
  const d = new Date(start);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return `Today ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function figmaDisplayName(link: FigmaLink) {
  return link.name || link.url.replace(/^https?:\/\//, "").slice(0, 32) + (link.url.length > 32 ? "…" : "");
}

function formatDueShort(dueAt: string | null): string {
  if (!dueAt) return "No date";
  const d = new Date(dueAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function groupTasksByDue(tasks: NextTask[]): { today: NextTask[]; thisWeek: NextTask[] } {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  const today: NextTask[] = [];
  const thisWeek: NextTask[] = [];
  for (const t of tasks) {
    if (!t.due_at) {
      thisWeek.push(t);
      continue;
    }
    const due = new Date(t.due_at);
    if (due <= endOfToday) today.push(t);
    else if (due <= endOfWeek) thisWeek.push(t);
    else thisWeek.push(t);
  }
  return { today, thisWeek };
}

type FeedItem = { type: "artifact"; id: string; title: string; updated_at: string };

function mergeFeed(artifacts: FeedArtifact[]): FeedItem[] {
  return artifacts
    .slice(0, 20)
    .map((a) => ({ type: "artifact" as const, id: `artifact-${a.id}`, title: a.title, updated_at: a.updated_at }));
}

export function ProjectDashboard({
  projectId,
  projectName,
  tasksCount,
  contactsCount,
  artifactsCount,
  nextTasks,
  recentArtifacts,
  upcomingEvents,
  figmaLinks,
}: DashboardProps) {
  const feedItems = mergeFeed(recentArtifacts);
  const hasActivity = feedItems.length > 0;
  const { today: tasksToday, thisWeek: tasksThisWeek } = groupTasksByDue(nextTasks);
  const nextEventLabel =
    upcomingEvents.length > 0
      ? formatEventTime(upcomingEvents[0].start_at)
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-8)",
        maxWidth: "72rem",
      }}
    >
      {/* Hero + primary CTA */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-lg)",
            color: "var(--color-text-muted)",
            fontWeight: "var(--font-medium)",
          }}
        >
          What's next for {projectName}?
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <Link
            href={`/projects/${projectId}/tasks`}
            className="dashboard-cta-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 var(--space-5)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-semibold)",
              color: "var(--color-inverse)",
              backgroundColor: "var(--color-primary)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              textDecoration: "none",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            Add task
          </Link>
          <Link
            href={`/projects/${projectId}/artifacts`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 var(--space-5)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-medium)",
              color: "var(--color-text)",
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              textDecoration: "none",
            }}
          >
            Add note
          </Link>
        </div>
      </div>

      {/* One-line summary: what each thing is + counts (no redundant cards) */}
      <div
        className="dashboard-metrics-inner"
        style={{
          padding: "var(--space-3) var(--space-4)",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--color-text)" }}>Tasks</strong> = to-dos.{" "}
          <strong style={{ color: "var(--color-text)" }}>Notes</strong> = meeting notes &amp; docs.
        </p>
        <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-sm)" }}>
          <Link href={`/projects/${projectId}/tasks`} style={{ color: "var(--color-accent)", fontWeight: "var(--font-semibold)", textDecoration: "none" }}>
            {tasksCount} tasks
          </Link>
          {" · "}
          <Link href={`/projects/${projectId}/artifacts`} style={{ color: "var(--color-accent)", fontWeight: "var(--font-semibold)", textDecoration: "none" }}>
            {artifactsCount} notes
          </Link>
          {nextEventLabel && (
            <>
              {" · "}
              <span style={{ color: "var(--color-text-muted)" }}>Next: {nextEventLabel}</span>
            </>
          )}
        </p>
      </div>

      {/* Main: feed + sidebar */}
      <div
        data-dashboard-grid
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "var(--space-10)",
          alignItems: "start",
        }}
      >
        {/* Activity feed with tabs (Notion/ClickUp style) */}
        {!hasActivity ? (
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: "0 0 var(--space-4) 0",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-semibold)",
                color: "var(--color-text-muted)",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              Activity
            </h2>
            <Card variant="outlined">
              <CardContent style={{ padding: "var(--space-8)" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-base)",
                    color: "var(--color-text-muted)",
                    textAlign: "center",
                  }}
                >
                  No notes yet. Add meeting notes and docs from Notes or import from Granola.
                </p>
                <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "center" }}>
                  <Link
                    href={`/projects/${projectId}/artifacts`}
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-primary)",
                      textDecoration: "none",
                    }}
                  >
                    Add note →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <DashboardActivityFeed projectId={projectId} feedItems={feedItems} />
        )}

        {/* Right column: Focus (tasks + events) + quick links */}
        <aside
          data-dashboard-sidebar
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-6)",
            position: "sticky",
            top: "var(--space-8)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-semibold)",
                color: "var(--color-text-muted)",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              Focus
            </h2>
            {/* Up next – tasks (Today / This week) */}
            <div>
            <h3
              style={{
                margin: "0 0 var(--space-3) 0",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-semibold)",
                color: "var(--color-text)",
              }}
            >
              Up next
            </h3>
            {nextTasks.length === 0 ? (
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                No tasks due.{" "}
                <Link href={`/projects/${projectId}/tasks`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                  Add task
                </Link>
              </p>
            ) : (
              <>
                {tasksToday.length > 0 && (
                  <div style={{ marginBottom: "var(--space-4)" }}>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-semibold)",
                        color: "var(--color-primary)",
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                      }}
                    >
                      Today
                    </span>
                    <ul style={{ margin: "var(--space-2) 0 0 0", padding: 0, listStyle: "none" }}>
                      {tasksToday.map((t) => (
                        <li key={t.id} style={{ marginBottom: "var(--space-2)" }}>
                          <Link
                            href={`/projects/${projectId}/tasks`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--space-2)",
                              fontSize: "var(--text-sm)",
                              color: "var(--color-text)",
                              textDecoration: "none",
                              padding: "var(--space-2) 0",
                              borderBottom: "1px solid var(--color-border-subtle)",
                            }}
                          >
                            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.title}
                            </span>
                            <span
                              style={{
                                flexShrink: 0,
                                fontSize: "var(--text-xs)",
                                padding: "2px 6px",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--color-primary-muted)",
                                color: "var(--color-accent)",
                                fontWeight: "var(--font-medium)",
                              }}
                            >
                              Today
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {tasksThisWeek.length > 0 && (
                  <div>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-semibold)",
                        color: "var(--color-text-muted)",
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                      }}
                    >
                      This week
                    </span>
                    <ul style={{ margin: "var(--space-2) 0 0 0", padding: 0, listStyle: "none" }}>
                      {tasksThisWeek.map((t) => (
                        <li key={t.id} style={{ marginBottom: "var(--space-2)" }}>
                          <Link
                            href={`/projects/${projectId}/tasks`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--space-2)",
                              fontSize: "var(--text-sm)",
                              color: "var(--color-text)",
                              textDecoration: "none",
                              padding: "var(--space-2) 0",
                              borderBottom: "1px solid var(--color-border-subtle)",
                            }}
                          >
                            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.title}
                            </span>
                            <span style={{ flexShrink: 0, fontSize: "var(--text-xs)", color: "var(--color-text-subtle)" }}>
                              {formatDueShort(t.due_at)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            <Link
              href={`/projects/${projectId}/tasks`}
              style={{
                fontSize: "var(--text-sm)",
                marginTop: "var(--space-2)",
                display: "inline-block",
                color: "var(--color-primary)",
                textDecoration: "none",
              }}
            >
              View all tasks →
            </Link>
          </div>

            {/* Upcoming – calendar events */}
            <div>
            <h3
              style={{
                margin: "0 0 var(--space-3) 0",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-semibold)",
                color: "var(--color-text)",
              }}
            >
              Upcoming
            </h3>
            {upcomingEvents.length === 0 ? (
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                No events.{" "}
                <Link href={`/projects/${projectId}/settings#calendar`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                  Add in Settings
                </Link>
              </p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {upcomingEvents.map((ev) => (
                  <li key={ev.id} style={{ marginBottom: "var(--space-2)" }}>
                    {ev.link ? (
                      <a
                        href={ev.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "block",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text)",
                          textDecoration: "none",
                          padding: "var(--space-2) 0",
                        }}
                      >
                        {ev.title}
                      </a>
                    ) : (
                      <span style={{ display: "block", fontSize: "var(--text-sm)", padding: "var(--space-2) 0" }}>{ev.title}</span>
                    )}
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-subtle)" }}>{formatEventTime(ev.start_at)}</span>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </div>

          {/* Quick links – compact (Granola lives in sidebar only) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
              paddingTop: "var(--space-4)",
              borderTop: "1px solid var(--color-border-subtle)",
            }}
          >
            <Link
              href={`/projects/${projectId}/settings#teammates`}
              style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}
            >
              Teammates {contactsCount > 0 && `(${contactsCount})`}
            </Link>
            <Link
              href={`/projects/${projectId}/settings#figma`}
              style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}
            >
              Design {figmaLinks.length > 0 && `(${figmaLinks.length})`}
            </Link>
            <a
              href={CHATGPT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}
            >
              Open ChatGPT →
            </a>
          </div>
        </aside>
      </div>

      {/* Responsive: stack on narrow */}
      <style>{`
        @media (max-width: 768px) {
          [data-dashboard-grid] {
            grid-template-columns: 1fr !important;
          }
          [data-dashboard-sidebar] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
