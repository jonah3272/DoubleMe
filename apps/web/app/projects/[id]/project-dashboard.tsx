import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

const CHATGPT_URL = "https://chat.openai.com";

type DashboardProps = {
  projectId: string;
  projectName: string;
  tasksCount: number;
  contactsCount: number;
  conversationsCount: number;
  artifactsCount: number;
};

export function ProjectDashboard({
  projectId,
  projectName,
  tasksCount,
  contactsCount,
  conversationsCount,
  artifactsCount,
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
          <Link
            href={`/projects/${projectId}/threads`}
            style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-2)", display: "inline-block", color: "var(--color-primary)", textDecoration: "none" }}
          >
            View threads →
          </Link>
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
            Upcoming events when you connect Google or Outlook.
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-subtle)" }}>
            Connect in Settings.
          </p>
          <Link
            href={`/projects/${projectId}/settings`}
            style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-2)", display: "inline-block", color: "var(--color-primary)", textDecoration: "none" }}
          >
            Settings →
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
            Recent Figma files and design links when connected.
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-subtle)" }}>
            Connect Figma in Settings.
          </p>
          <Link
            href={`/projects/${projectId}/settings`}
            style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-2)", display: "inline-block", color: "var(--color-primary)", textDecoration: "none" }}
          >
            Settings →
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
