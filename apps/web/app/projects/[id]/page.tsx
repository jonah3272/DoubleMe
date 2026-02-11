import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId } from "@/lib/validators";
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
  if (!isValidProjectId(id)) notFound();
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, description, updated_at")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const nowIso = new Date().toISOString();
  const [
    tasksRes,
    contactsRes,
    convRes,
    artRes,
    { data: nextTasksData },
    { data: latestConv },
    { data: latestArtifact },
  ] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase
      .from("tasks")
      .select("id, title, status")
      .eq("project_id", id)
      .in("status", ["todo", "in_progress"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(3),
    supabase.from("conversations").select("id, title, updated_at").eq("project_id", id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("artifacts").select("id, title, updated_at").eq("project_id", id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const [upcomingRes, figmaRes] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, start_at, end_at, link")
      .eq("project_id", id)
      .gte("start_at", nowIso)
      .order("start_at", { ascending: true })
      .limit(5),
    supabase
      .from("figma_links")
      .select("id, url, name")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const upcomingEvents = upcomingRes.error ? [] : (upcomingRes.data ?? []);
  const figmaLinks = figmaRes.error ? [] : (figmaRes.data ?? []);
  const tasksCount = tasksRes.count ?? 0;
  const contactsCount = contactsRes.count ?? 0;
  const conversationsCount = convRes.count ?? 0;
  const artifactsCount = artRes.count ?? 0;
  const nextTasks = nextTasksData ?? [];
  const latestThread = latestConv ?? null;
  const latestArt = latestArtifact ?? null;

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
      <Link
        href={`/projects/${id}/threads`}
        style={{ display: "block", marginTop: "var(--space-2)", color: "var(--color-text-muted)", textDecoration: "none", fontSize: "var(--text-sm)" }}
      >
        Threads
      </Link>
      <Link
        href={`/projects/${id}/artifacts`}
        style={{ display: "block", marginTop: "var(--space-1)", color: "var(--color-text-muted)", textDecoration: "none", fontSize: "var(--text-sm)" }}
      >
        Artifacts
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
          nextTasks={nextTasks}
          latestThread={latestThread}
          latestArtifact={latestArt}
          upcomingEvents={upcomingEvents}
          figmaLinks={figmaLinks}
        />
      </div>
    </AppShell>
  );
}
