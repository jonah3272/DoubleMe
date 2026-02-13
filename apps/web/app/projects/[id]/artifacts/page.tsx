import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId } from "@/lib/validators";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectSidebar } from "../project-sidebar";
import { ArtifactsClient } from "./artifacts-client";

export const dynamic = "force-dynamic";

export default async function ProjectArtifactsPage({
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

  const { data: artifacts } = await supabase
    .from("artifacts")
    .select("id, title, body, artifact_type, occurred_at")
    .eq("project_id", id)
    .order("updated_at", { ascending: false })
    .limit(100);
  const initialArtifacts = (artifacts ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    artifact_type: a.artifact_type,
    occurred_at: a.occurred_at,
  }));

  return (
    <AppShell sidebar={<ProjectSidebar projectId={id} projectName={project.name} />}>
      <PageHeader title="Notes" description={`Notes, meeting summaries, and plans for ${project.name}`} />
      <div style={{ padding: "var(--space-8)", maxWidth: "56rem" }}>
        <ArtifactsClient projectId={id} initialArtifacts={initialArtifacts} />
      </div>
    </AppShell>
  );
}
