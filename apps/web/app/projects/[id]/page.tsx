import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, description, updated_at")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const projectsSidebar = (
    <nav style={{ padding: "var(--space-4)", fontSize: "var(--text-sm)" }}>
      <Link
        href="/dashboard"
        style={{
          display: "block",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          marginBottom: "var(--space-2)",
        }}
      >
        Dashboard
      </Link>
      <Link
        href="/projects"
        style={{
          display: "block",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          marginBottom: "var(--space-4)",
        }}
      >
        Projects
      </Link>
      <span style={{ fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>
        {project.name}
      </span>
    </nav>
  );

  return (
    <AppShell sidebar={projectsSidebar}>
      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
      />
      <div
        style={{
          padding: "var(--space-8)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          fontSize: "var(--text-sm)",
        }}
      >
        <p style={{ margin: 0 }}>Workspace. Threads and artifacts will appear here.</p>
      </div>
    </AppShell>
  );
}
