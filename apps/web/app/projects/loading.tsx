import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const projectsSidebar = (
  <nav style={{ padding: "var(--space-4)", fontSize: "var(--text-sm)" }}>
    <Link
      href="/dashboard"
      style={{
        display: "block",
        color: "var(--color-text-muted)",
        textDecoration: "none",
        marginBottom: "var(--space-4)",
      }}
    >
      Dashboard
    </Link>
    <span style={{ fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>
      Projects
    </span>
  </nav>
);

export default function ProjectsLoading() {
  return (
    <AppShell sidebar={projectsSidebar}>
      <PageHeader title="Projects" description="Your projects." />
      <div style={{ padding: "var(--space-6) var(--space-8)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} variant="outlined" style={{ padding: "var(--space-6)" }}>
              <Skeleton height={24} width="40%" style={{ marginBottom: "var(--space-2)" }} />
              <Skeleton height={16} width="70%" />
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
