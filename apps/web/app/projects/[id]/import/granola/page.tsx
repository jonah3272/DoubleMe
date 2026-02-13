import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId } from "@/lib/validators";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectSidebar } from "../../project-sidebar";

const GranolaImportClient = dynamic(
  () => import("./granola-import-client").then((m) => ({ default: m.GranolaImportClient })),
  { ssr: true, loading: () => <div style={{ padding: "var(--space-8)", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Loading…</div> }
);

export const dynamic = "force-dynamic";

export default async function GranolaImportPage({
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

  return (
    <AppShell sidebar={<ProjectSidebar projectId={id} projectName={project.name} />}>
      <PageHeader
        title="Import from Granola"
        description="Load today's meetings (or expand the range), get AI summaries and action items, then import tasks and notes."
      />
      <div style={{ padding: "var(--space-8)", flex: 1, maxWidth: "52rem", margin: "0 auto", width: "100%" }}>
        <GranolaImportClient projectId={id} projectName={project.name} />
      </div>
    </AppShell>
  );
}
