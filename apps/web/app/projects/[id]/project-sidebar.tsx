"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FromGranolaTrigger } from "./from-granola-trigger";

const iconSize = 20;

const icons = {
  back: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  overview: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  settings: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  threads: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  tasks: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  artifacts: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  granola: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

export function ProjectSidebar({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const isOverview = pathname === base;
  const isSettings = pathname === `${base}/settings`;
  const isThreads = pathname.startsWith(`${base}/threads`);
  const isTasks = pathname === `${base}/tasks`;
  const isArtifacts = pathname === `${base}/artifacts`;

  const navLinkBase = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    padding: "var(--space-2) var(--space-3)",
    borderRadius: "var(--radius-md)",
    textDecoration: "none",
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-medium)",
    transition: "background-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
  } as const;

  const navLinkActive = {
    ...navLinkBase,
    backgroundColor: "var(--color-bg-muted)",
    color: "var(--color-text)",
  };
  const navLinkInactive = {
    ...navLinkBase,
    color: "var(--color-text-muted)",
  };

  return (
    <aside
      className="project-sidebar"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "var(--space-4)",
      }}
    >
      {/* Back to Projects */}
      <Link
        href="/projects"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "var(--space-2) var(--space-3)",
          marginBottom: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          fontWeight: "var(--font-medium)",
          transition: "background-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
        }}
        className="project-sidebar-back"
      >
        <span style={{ display: "flex", flexShrink: 0 }}>{icons.back}</span>
        Projects
      </Link>

      {/* Project name – context header */}
      <div
        style={{
          padding: "var(--space-2) var(--space-3)",
          marginBottom: "var(--space-2)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-semibold)",
            color: "var(--color-text-subtle)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Project
        </span>
        <Link
          href={base}
          className={isOverview ? "project-sidebar-overview-link" : undefined}
          style={{
            display: "block",
            marginTop: "var(--space-1)",
            fontSize: "var(--text-base)",
            fontWeight: "var(--font-semibold)",
            color: isOverview ? "var(--color-accent)" : "var(--color-text)",
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "color var(--duration-fast) var(--ease-out)",
          }}
        >
          {projectName}
        </Link>
      </div>

      {/* Main nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }} aria-label="Project navigation">
        <Link href={base} style={isOverview ? navLinkActive : navLinkInactive}>
          <span style={{ display: "flex", flexShrink: 0 }}>{icons.overview}</span>
          Overview
        </Link>
        <Link href={`${base}/threads`} style={isThreads ? navLinkActive : navLinkInactive}>
          <span style={{ display: "flex", flexShrink: 0 }}>{icons.threads}</span>
          Conversations
        </Link>
        <Link href={`${base}/tasks`} style={isTasks ? navLinkActive : navLinkInactive}>
          <span style={{ display: "flex", flexShrink: 0 }}>{icons.tasks}</span>
          Tasks
        </Link>
        <Link href={`${base}/artifacts`} style={isArtifacts ? navLinkActive : navLinkInactive}>
          <span style={{ display: "flex", flexShrink: 0 }}>{icons.artifacts}</span>
          Notes
        </Link>
        <Link href={`${base}/settings`} style={isSettings ? navLinkActive : navLinkInactive}>
          <span style={{ display: "flex", flexShrink: 0 }}>{icons.settings}</span>
          Settings
        </Link>
      </nav>

      {/* Integrations / Quick actions */}
      <div
        style={{
          marginTop: "var(--space-6)",
          paddingTop: "var(--space-4)",
          borderTop: "1px solid var(--color-border-subtle)",
        }}
      >
        <span
          style={{
            display: "block",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-semibold)",
            color: "var(--color-text-subtle)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Import
        </span>
        <div
          style={{
            marginTop: "var(--space-1)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            transition: "background-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
          }}
          className="project-sidebar-granola-wrap"
        >
          <span style={{ display: "flex", flexShrink: 0 }}>{icons.granola}</span>
          <FromGranolaTrigger projectId={projectId} variant="link" />
        </div>
      </div>

      <style>{`
        .project-sidebar-back:hover {
          background: var(--color-bg-muted);
          color: var(--color-text);
        }
        .project-sidebar a[href]:hover {
          background: var(--color-bg-muted) !important;
          color: var(--color-text) !important;
        }
        .project-sidebar-overview-link:hover {
          color: var(--color-accent-hover) !important;
        }
        .project-sidebar-granola-wrap:hover {
          background: var(--color-bg-muted);
          color: var(--color-text);
        }
        .project-sidebar-granola-wrap:hover button {
          color: inherit !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .project-sidebar * {
            transition: none !important;
          }
        }
      `}</style>
    </aside>
  );
}
