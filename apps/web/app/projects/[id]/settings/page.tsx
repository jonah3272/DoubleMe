import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectTools } from "../project-tools";

export const dynamic = "force-dynamic";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  const { data: agents } = await supabase
    .from("project_agents")
    .select("agent_key")
    .eq("project_id", id);
  const enabledAgentKeys = (agents ?? []).map((a) => a.agent_key);

  const nav = (
    <nav style={{ padding: "var(--space-4)", fontSize: "var(--text-sm)" }}>
      <Link href={`/projects/${id}`} style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "var(--space-4)" }}>
        ← Dashboard
      </Link>
      <span style={{ fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>Settings</span>
    </nav>
  );

  return (
    <AppShell sidebar={nav}>
      <PageHeader title="Settings" description={`Tools and integrations for ${project.name}`} />
      <div style={{ padding: "var(--space-8)", maxWidth: "56rem", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Enable tools to connect them later (calendar, Figma, meeting notes). Output from connected tools and MCPs will show on the dashboard. Disabling hides a tool from the dashboard.
        </p>
        <div id="tools">
          <ProjectTools projectId={id} enabledAgentKeys={enabledAgentKeys} />
        </div>
        <div id="teammates" style={{ marginTop: "var(--space-6)" }}>
          <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>Teammates</h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Add and edit contacts here once the contacts UI is added. You can assign tasks to teammates from the Tasks page.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
