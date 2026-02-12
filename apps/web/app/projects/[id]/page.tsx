import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId } from "@/lib/validators";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectDashboard } from "./project-dashboard";
import { ProjectSidebar } from "./project-sidebar";

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
    { data: recentConvs },
    { data: recentArtifacts },
  ] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase
      .from("tasks")
      .select("id, title, status, due_at")
      .eq("project_id", id)
      .in("status", ["todo", "in_progress"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(10),
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("project_id", id)
      .order("updated_at", { ascending: false })
      .limit(15),
    supabase
      .from("artifacts")
      .select("id, title, updated_at")
      .eq("project_id", id)
      .order("updated_at", { ascending: false })
      .limit(15),
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
  const recentThreads = recentConvs ?? [];
  const recentArtifactsList = recentArtifacts ?? [];

  return (
    <AppShell sidebar={<ProjectSidebar projectId={id} projectName={project.name} />}>
      <PageHeader
        title={project.name}
        description={project.description ?? "Overview of your workspace. Connect calendar, Figma, and tools in Settings—their output will show here."}
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
          recentThreads={recentThreads}
          recentArtifacts={recentArtifactsList}
          upcomingEvents={upcomingEvents}
          figmaLinks={figmaLinks}
        />
      </div>
    </AppShell>
  );
}
