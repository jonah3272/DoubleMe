import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export default function ProjectNotFound() {
  return (
    <AppShell>
      <PageHeader title="Project not found" />
      <div style={{ padding: "var(--space-8)", maxWidth: 400 }}>
        <p style={{ margin: "0 0 var(--space-6) 0", color: "var(--color-text-muted)" }}>
          This project does not exist or you don’t have access to it.
        </p>
        <Link
          href="/projects"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 40,
            padding: "0 var(--space-4)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            color: "var(--color-text)",
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          Back to projects
        </Link>
      </div>
    </AppShell>
  );
}
