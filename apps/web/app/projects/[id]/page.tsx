import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectDashboard } from "./project-dashboard";

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

  const [tasksRes, contactsRes, convRes, artRes] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("project_id", id),
  ]);
  const tasksCount = tasksRes.count ?? 0;
  const contactsCount = contactsRes.count ?? 0;
  const conversationsCount = convRes.count ?? 0;
  const artifactsCount = artRes.count ?? 0;

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
        Home
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
      <Link
        href={`/projects/${id}`}
        style={{
          display: "block",
          marginTop: "var(--space-2)",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          fontSize: "var(--text-sm)",
        }}
      >
        Dashboard
      </Link>
      <Link
        href={`/projects/${id}/settings`}
        style={{
          display: "block",
          marginTop: "var(--space-1)",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          fontSize: "var(--text-sm)",
        }}
      >
        Settings
      </Link>
    </nav>
  );

  return (
    <AppShell sidebar={projectsSidebar}>
      <PageHeader
        title={project.name}
        description={project.description ?? "Your workspace. Connect calendar, Figma, and tools in Settings—their output will show here."}
      />
      <div
        style={{
          padding: "var(--space-8)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
        }}
      >
        <ProjectDashboard
          projectId={id}
          projectName={project.name}
          tasksCount={tasksCount}
          contactsCount={contactsCount}
          conversationsCount={conversationsCount}
          artifactsCount={artifactsCount}
        />
      </div>
    </AppShell>
  );
}
