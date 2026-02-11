import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

const CHATGPT_URL = "https://chat.openai.com";

type NextTask = { id: string; title: string; status: string };
type LatestThread = { id: string; title: string | null; updated_at: string } | null;
type LatestArtifact = { id: string; title: string; updated_at: string } | null;
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
  latestThread: LatestThread;
  latestArtifact: LatestArtifact;
  upcomingEvents: UpcomingEvent[];
  figmaLinks: FigmaLink[];
};

function formatEventTime(start: string) {
  const d = new Date(start);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return `Today ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function figmaDisplayName(link: FigmaLink) {
  return link.name || link.url.replace(/^https?:\/\//, "").slice(0, 32) + (link.url.length > 32 ? "…" : "");
}

export function ProjectDashboard({
  projectId,
  projectName,
  tasksCount,
  contactsCount,
  conversationsCount,
  artifactsCount,
  nextTasks,
  latestThread,
  latestArtifact,
  upcomingEvents,
  figmaLinks,
}: DashboardProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "var(--space-4)",
      }}
    >
      {/* Activity / Threads */}
      <Card variant="outlined">
        <CardContent style={{ padding: "var(--space-4)" }}>
          <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>
            Activity
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>
            Threads and artifacts from this project.
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
            {conversationsCount === 0 && artifactsCount === 0
              ? "No threads or artifacts yet."
              : `${conversationsCount} thread${conversationsCount !== 1 ? "s" : ""}, ${artifactsCount} artifact${artifactsCount !== 1 ? "s" : ""}.`}
          </p>
          {(latestThread || latestArtifact) && (
            <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-subtle)" }}>
              {latestThread && (
                <>
                  Latest thread: <Link href={`/projects/${projectId}/threads/${latestThread.id}`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>{latestThread.title || "Thread"}</Link>
                  {latestArtifact && " · "}
                </>
              )}
              {latestArtifact && (
                <>
                  Latest artifact: <Link href={`/projects/${projectId}/artifacts`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>{latestArtifact.title}</Link>
                </>
              )}
            </p>
          )}
          <div style={{ marginTop: "var(--space-2)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <Link href={`/projects/${projectId}/threads`} style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", textDecoration: "none" }}>
              View threads →
            </Link>
            <span style={{ color: "var(--color-border)" }}>·</span>
            <Link href={`/projects/${projectId}/artifacts`} style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", textDecoration: "none" }}>
              View artifacts →
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card variant="outlined">
        <CardContent style={{ padding: "var(--space-4)" }}>
          <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>
            Tasks
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>
            Assign work and track progress.
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
            {tasksCount === 0 ? "No tasks yet." : `${tasksCount} task${tasksCount !== 1 ? "s" : ""}.`}
          </p>
          {nextTasks.length > 0 && (
            <ul style={{ margin: "var(--space-2) 0 0 0", paddingLeft: "var(--space-4)", fontSize: "var(--text-sm)" }}>
              {nextTasks.map((t) => (
                <li key={t.id}>
                  <Link href={`/projects/${projectId}/tasks`} style={{ color: "var(--color-text)", textDecoration: "none" }}>{t.title}</Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/projects/${projectId}/tasks`}
            style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-2)", display: "inline-block", color: "var(--color-primary)", textDecoration: "none" }}
          >
            View tasks →
          </Link>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card variant="outlined">
        <CardContent style={{ padding: "var(--space-4)" }}>
          <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>
            Calendar
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>
            Upcoming events. Add in Settings or connect Google/Outlook later.
          </p>
          {upcomingEvents.length === 0 ? (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-subtle)" }}>No upcoming events.</p>
          ) : (
            <ul style={{ margin: "0 0 var(--space-2) 0", paddingLeft: "var(--space-4)", fontSize: "var(--text-sm)" }}>
              {upcomingEvents.map((ev) => (
                <li key={ev.id}>
                  {ev.link ? (
                    <a href={ev.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text)", textDecoration: "none" }}>
                      {ev.title}
                    </a>
                  ) : (
                    <span>{ev.title}</span>
                  )}
                  <span style={{ marginLeft: "var(--space-1)", color: "var(--color-text-muted)" }}>— {formatEventTime(ev.start_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/projects/${projectId}/settings#calendar`}
            style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-2)", display: "inline-block", color: "var(--color-primary)", textDecoration: "none" }}
          >
            {upcomingEvents.length === 0 ? "Add event in Settings →" : "Settings →"}
          </Link>
        </CardContent>
      </Card>

      {/* Teammates */}
      <Card variant="outlined">
        <CardContent style={{ padding: "var(--space-4)" }}>
          <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>
            Teammates
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>
            Contacts you can assign tasks to.
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
            {contactsCount === 0 ? "No teammates added yet." : `${contactsCount} teammate${contactsCount !== 1 ? "s" : ""}.`}
          </p>
          <Link
            href={`/projects/${projectId}/settings#teammates`}
            style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-2)", display: "inline-block", color: "var(--color-primary)", textDecoration: "none" }}
          >
            Manage in Settings →
          </Link>
        </CardContent>
      </Card>

      {/* Figma / Design */}
      <Card variant="outlined">
        <CardContent style={{ padding: "var(--space-4)" }}>
          <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>
            Design
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>
            Figma files and design links. Add in Settings.
          </p>
          {figmaLinks.length === 0 ? (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-subtle)" }}>No Figma links yet.</p>
          ) : (
            <ul style={{ margin: "0 0 var(--space-2) 0", paddingLeft: "var(--space-4)", fontSize: "var(--text-sm)" }}>
              {figmaLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                    {figmaDisplayName(link)}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/projects/${projectId}/settings#figma`}
            style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-2)", display: "inline-block", color: "var(--color-primary)", textDecoration: "none" }}
          >
            {figmaLinks.length === 0 ? "Add Figma link in Settings →" : "Settings →"}
          </Link>
        </CardContent>
      </Card>

      {/* Chat – external link (embed blocked by CSP) */}
      <Card variant="outlined">
        <CardContent style={{ padding: "var(--space-4)" }}>
          <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>
            Chat
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>
            Use your own ChatGPT Plus. Opens in a new tab (ChatGPT doesn’t allow embedding).
          </p>
          <a
            href={CHATGPT_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 40,
              padding: "0 var(--space-4)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-medium)",
              color: "var(--color-inverse)",
              backgroundColor: "var(--color-primary)",
              border: "none",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
            }}
          >
            Open ChatGPT →
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
