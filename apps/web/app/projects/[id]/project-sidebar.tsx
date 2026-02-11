"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkStyle = {
  display: "block",
  textDecoration: "none",
  fontSize: "var(--text-sm)",
} as const;

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

  const activeStyle = { ...linkStyle, fontWeight: "var(--font-semibold)", color: "var(--color-text)" };
  const inactiveStyle = { ...linkStyle, color: "var(--color-text-muted)" };

  return (
    <nav style={{ padding: "var(--space-4)", fontSize: "var(--text-sm)" }}>
      <Link
        href="/projects"
        style={{
          ...linkStyle,
          color: "var(--color-text-muted)",
          marginBottom: "var(--space-4)",
        }}
      >
        ← Projects
      </Link>
      <Link
        href={base}
        style={isOverview ? activeStyle : { ...inactiveStyle, marginBottom: "var(--space-2)" }}
      >
        {projectName}
      </Link>
      <Link
        href={`${base}/settings`}
        style={isSettings ? activeStyle : { ...inactiveStyle, marginTop: "var(--space-1)" }}
      >
        Settings
      </Link>
      <Link
        href={`${base}/threads`}
        style={isThreads ? activeStyle : { ...inactiveStyle, marginTop: "var(--space-1)" }}
      >
        Threads
      </Link>
      <Link
        href={`${base}/tasks`}
        style={isTasks ? activeStyle : { ...inactiveStyle, marginTop: "var(--space-1)" }}
      >
        Tasks
      </Link>
      <Link
        href={`${base}/artifacts`}
        style={isArtifacts ? activeStyle : { ...inactiveStyle, marginTop: "var(--space-1)" }}
      >
        Artifacts
      </Link>
    </nav>
  );
}
