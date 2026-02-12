"use client";

import { useState } from "react";
import Link from "next/link";

type FeedItem =
  | { type: "thread"; id: string; title: string; updated_at: string; threadId: string }
  | { type: "artifact"; id: string; title: string; updated_at: string };

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
  const [tab, setTab] = useState<"all" | "threads" | "artifacts">("all");
  const filtered =
    tab === "all"
      ? feedItems
      : tab === "threads"
        ? feedItems.filter((i) => i.type === "thread")
        : feedItems.filter((i) => i.type === "artifact");

  const tabStyle = (active: boolean) => ({
    padding: "var(--space-2) var(--space-3)",
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-medium)" as const,
    color: active ? "var(--color-primary)" : "var(--color-text-muted)",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid var(--color-primary)" : "2px solid transparent",
    cursor: "pointer",
    marginBottom: "-2px",
  });

  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
        }}
      >
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
          Activity
        </h2>
        <div style={{ display: "flex", gap: 0 }}>
          <button type="button" style={tabStyle(tab === "all")} onClick={() => setTab("all")}>
            All
          </button>
          <button type="button" style={tabStyle(tab === "threads")} onClick={() => setTab("threads")}>
            Threads
          </button>
          <button type="button" style={tabStyle(tab === "artifacts")} onClick={() => setTab("artifacts")}>
            Artifacts
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          {tab === "all" ? "No threads or artifacts yet." : `No ${tab} yet.`}
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {filtered.map((item) => (
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
                    backgroundColor:
                      item.type === "thread" ? "var(--color-primary-muted)" : "var(--color-bg-muted)",
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
  );
}
