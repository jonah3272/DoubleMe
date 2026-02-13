"use client";

import Link from "next/link";

type FeedItem = { type: "artifact"; id: string; title: string; updated_at: string };

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

export function DashboardActivityFeed({
  projectId,
  feedItems,
}: {
  projectId: string;
  feedItems: FeedItem[];
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
        Recent notes.
      </p>
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
      {feedItems.length === 0 ? (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          No notes yet.
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {feedItems.map((item) => (
            <li key={item.id}>
              <Link
                href={`/projects/${projectId}/artifacts`}
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
                    padding: "2px 8px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-bg-muted)",
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--font-medium)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Note
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
                <span style={{ flexShrink: 0, fontSize: "var(--text-xs)", color: "var(--color-text-subtle)" }}>
                  {formatRelative(item.updated_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {feedItems.length > 0 && (
        <p style={{ margin: "var(--space-3) 0 0 0", fontSize: "var(--text-sm)" }}>
          <Link href={`/projects/${projectId}/artifacts`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>
            All notes
          </Link>
        </p>
      )}
    </div>
  );
}
