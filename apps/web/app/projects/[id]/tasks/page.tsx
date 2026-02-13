import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId } from "@/lib/validators";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectSidebar } from "../project-sidebar";
import { TasksClient } from "./tasks-client";

export const dynamic = "force-dynamic";

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidProjectId(id)) notFound();
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  const [{ data: tasksData }, { data: contactsData }] = await Promise.all([
    supabase.from("tasks").select("id, title, status, assignee_id, due_at, notes, source_meeting_label, source_meeting_id").eq("project_id", id).order("updated_at", { ascending: false }).limit(100),
    supabase.from("contacts").select("id, name").eq("project_id", id).order("name").limit(100),
  ]);
  const contacts = (contactsData ?? []).map((c) => ({ id: c.id, name: c.name }));
  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c.name]));
  const initialTasks = (tasksData ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    assignee_id: t.assignee_id,
    assignee_name: t.assignee_id ? contactMap[t.assignee_id] ?? null : null,
    due_at: t.due_at,
    notes: t.notes,
    source_meeting_label: t.source_meeting_label ?? null,
    source_meeting_id: t.source_meeting_id ?? null,
  }));

  return (
    <AppShell sidebar={<ProjectSidebar projectId={id} projectName={project.name} />}>
      <PageHeader title="Tasks" description={`Tasks for ${project.name}. Assign work to teammates from Settings.`} />
      <div style={{ padding: "var(--space-8)", maxWidth: "56rem" }}>
        <TasksClient projectId={id} initialTasks={initialTasks} contacts={contacts} />
      </div>
    </AppShell>
  );
}
