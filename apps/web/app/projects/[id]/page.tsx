import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectTools } from "./project-tools";
import { ChatEmbed } from "./chat-embed";

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

  const { data: agents } = await supabase
    .from("project_agents")
    .select("agent_key")
    .eq("project_id", id);
  const enabledAgentKeys = (agents ?? []).map((a) => a.agent_key);

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
      <Link
        href={`/projects/${id}#chat`}
        style={{
          display: "block",
          marginTop: "var(--space-2)",
          color: "var(--color-text-muted)",
          textDecoration: "none",
          fontSize: "var(--text-sm)",
        }}
      >
        Chat
      </Link>
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
          gap: "var(--space-8)",
          maxWidth: "56rem",
        }}
      >
        <ProjectTools projectId={id} enabledAgentKeys={enabledAgentKeys} />
        <ChatEmbed />
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Threads and artifacts will appear here once you start conversations. Enable &quot;Threads&quot; if you want to track that tool as enabled.
        </p>
      </div>
    </AppShell>
  );
}
