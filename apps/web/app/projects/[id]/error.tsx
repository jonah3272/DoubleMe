"use client";

import Link from "next/link";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8)",
      }}
    >
      <h1 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)" }}>
        Project error
      </h1>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textAlign: "center", maxWidth: 360 }}>
        {error.message || "Something went wrong loading this project."}
      </p>
      <div style={{ marginTop: "var(--space-6)", display: "flex", gap: "var(--space-3)" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "var(--space-2) var(--space-4)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            color: "var(--color-inverse)",
            backgroundColor: "var(--color-primary)",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/projects"
          style={{
            padding: "var(--space-2) var(--space-4)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            color: "var(--color-text)",
            backgroundColor: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          Back to projects
        </Link>
      </div>
    </div>
  );
}
