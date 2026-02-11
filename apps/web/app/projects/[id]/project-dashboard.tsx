import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { FromGranolaTrigger } from "./from-granola-trigger";

const CHATGPT_URL = "https://chat.openai.com";

type NextTask = { id: string; title: string; status: string };
type FeedThread = { id: string; title: string | null; updated_at: string };
type FeedArtifact = { id: string; title: string; updated_at: string };
type UpcomingEvent = { id: string; title: string; start_at: string; end_at: string; link: string | null };
type FigmaLink = { id: string; url: string; name: string };

type DashboardProps = {
  projectId: string;
  projectName: string;
  tasksCount: number;
  contactsCount: number;
  conversationsCount: number;
  artifactsCount: number;
  nextTasks: NextTask[];
  recentThreads: FeedThread[];
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

type FeedItem =
  | { type: "thread"; id: string; title: string; updated_at: string; threadId: string }
  | { type: "artifact"; id: string; title: string; updated_at: string };

function mergeFeed(threads: FeedThread[], artifacts: FeedArtifact[]): FeedItem[] {
  const items: FeedItem[] = [
    ...threads.map((t) => ({
      type: "thread" as const,
      id: `thread-${t.id}`,
      title: t.title || "Thread",
      updated_at: t.updated_at,
      threadId: t.id,
    })),
    ...artifacts.map((a) => ({
      type: "artifact" as const,
      id: `artifact-${a.id}`,
      title: a.title,
      updated_at: a.updated_at,
    })),
  ];
  items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return items.slice(0, 20);
}

export function ProjectDashboard({
  projectId,
  projectName,
  tasksCount,
  contactsCount,
  conversationsCount,
  artifactsCount,
  nextTasks,
  recentThreads,
  recentArtifacts,
  upcomingEvents,
  figmaLinks,
}: DashboardProps) {
  const feedItems = mergeFeed(recentThreads, recentArtifacts);
  const hasActivity = feedItems.length > 0;

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
            href={`/projects/${projectId}/threads`}
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
            New thread
          </Link>
          <Link
            href={`/projects/${projectId}/tasks`}
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
            View tasks
          </Link>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <FromGranolaTrigger projectId={projectId} />
          </span>
        </div>
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
        {/* Activity feed */}
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
          {!hasActivity ? (
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
                  No threads or artifacts yet. Start a thread to capture decisions and context.
                </p>
                <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "center" }}>
                  <Link
                    href={`/projects/${projectId}/threads`}
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      color: "var(--color-primary)",
                      textDecoration: "none",
                    }}
                  >
                    New thread →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {feedItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={
                      item.type === "thread"
                        ? `/projects/${projectId}/threads/${item.threadId}`
                        : `/projects/${projectId}/artifacts`
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      padding: "var(--space-3) var(--space-2)",
                      marginLeft: "-var(--space-2)",
                      marginRight: "-var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                    className="feed-row"
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: "var(--radius-md)",
                        backgroundColor: item.type === "thread" ? "var(--color-primary-muted)" : "var(--color-bg-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-semibold)",
                        color: item.type === "thread" ? "var(--color-primary)" : "var(--color-text-muted)",
                      }}
                    >
                      {item.type === "thread" ? "T" : "A"}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-medium)",
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-subtle)",
                      }}
                    >
                      {formatRelative(item.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {hasActivity && (
            <p style={{ margin: "var(--space-3) 0 0 0", fontSize: "var(--text-sm)" }}>
              <Link
                href={`/projects/${projectId}/threads`}
                style={{ color: "var(--color-primary)", textDecoration: "none", marginRight: "var(--space-3)" }}
              >
                Threads
              </Link>
              <Link href={`/projects/${projectId}/artifacts`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                Artifacts
              </Link>
            </p>
          )}
        </div>

        {/* Sidebar: Up next, Upcoming, quick links */}
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
          {/* Up next – tasks */}
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
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {nextTasks.map((t) => (
                  <li key={t.id} style={{ marginBottom: "var(--space-2)" }}>
                    <Link
                      href={`/projects/${projectId}/tasks`}
                      style={{
                        display: "block",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text)",
                        textDecoration: "none",
                        padding: "var(--space-2) 0",
                        borderBottom: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
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

          {/* Upcoming – calendar */}
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

          {/* Quick links – compact */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
              paddingTop: "var(--space-4)",
              borderTop: "1px solid var(--color-border-subtle)",
            }}
          >
            <FromGranolaTrigger projectId={projectId} variant="link" />
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
        .feed-row:hover {
          background: var(--color-bg-muted);
        }
      `}</style>
    </div>
  );
}
