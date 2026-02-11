import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId } from "@/lib/validators";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectSidebar } from "../project-sidebar";
import { ProjectTools } from "../project-tools";
import { TeammatesSection } from "./teammates-section";
import { CalendarSection } from "./calendar-section";
import { FigmaSection } from "./figma-section";

export const dynamic = "force-dynamic";

export default async function ProjectSettingsPage({
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

  const [{ data: agents }, { data: contacts }, { data: calendarEvents }, { data: figmaLinks }] = await Promise.all([
    supabase.from("project_agents").select("agent_key").eq("project_id", id),
    supabase.from("contacts").select("id, name, email, role, notes").eq("project_id", id).order("name").limit(100),
    supabase.from("calendar_events").select("id, title, start_at, end_at, link").eq("project_id", id).order("start_at", { ascending: true }).limit(50),
    supabase.from("figma_links").select("id, url, name").eq("project_id", id).order("created_at", { ascending: false }).limit(50),
  ]);
  const enabledAgentKeys = (agents ?? []).map((a) => a.agent_key);
  const initialContacts = (contacts ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email ?? null,
    role: c.role ?? null,
    notes: c.notes ?? null,
  }));
  const initialEvents = (calendarEvents ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    start_at: e.start_at,
    end_at: e.end_at,
    link: e.link ?? null,
  }));
  const initialFigmaLinks = (figmaLinks ?? []).map((l) => ({ id: l.id, url: l.url, name: l.name }));

  return (
    <AppShell sidebar={<ProjectSidebar projectId={id} projectName={project.name} />}>
      <PageHeader title="Settings" description={`Tools and integrations for ${project.name}`} />
      <div style={{ padding: "var(--space-8)", maxWidth: "56rem", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Enable tools to connect them later (calendar, Figma, meeting notes). Output from connected tools and MCPs will show on the project overview. Disabling hides a tool from the overview.
        </p>
        <div id="tools">
          <ProjectTools projectId={id} enabledAgentKeys={enabledAgentKeys} />
        </div>
        <TeammatesSection projectId={id} initialContacts={initialContacts} />
        <CalendarSection projectId={id} initialEvents={initialEvents} />
        <FigmaSection projectId={id} initialLinks={initialFigmaLinks} />
      </div>
    </AppShell>
  );
}
