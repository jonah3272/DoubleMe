import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId, isUuid } from "@/lib/validators";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProjectSidebar } from "../../project-sidebar";
import { ThreadDetailClient } from "./thread-detail-client";

export const dynamic = "force-dynamic";

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string; threadId: string }>;
}) {
  const { id: projectId, threadId } = await params;
  if (!isValidProjectId(projectId) || !isUuid(threadId)) notFound();
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id, name").eq("id", projectId).single();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title")
    .eq("id", threadId)
    .eq("project_id", projectId)
    .single();
  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (!project || !conversation) notFound();

  const initialMessages = (messages ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    created_at: m.created_at,
  }));

  const title = conversation.title || "Thread";

  return (
    <AppShell sidebar={<ProjectSidebar projectId={projectId} projectName={project.name} />}>
      <PageHeader title={title} description={`Conversation in ${project.name}`} />
      <div style={{ padding: "var(--space-8)", maxWidth: "56rem" }}>
        <ThreadDetailClient projectId={projectId} threadId={threadId} initialMessages={initialMessages} />
      </div>
    </AppShell>
  );
}
