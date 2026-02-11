import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId } from "@/lib/validators";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ThreadsListClient } from "./threads-list-client";

export const dynamic = "force-dynamic";

export default async function ProjectThreadsPage({
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

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("project_id", id)
    .order("updated_at", { ascending: false })
    .limit(100);
  const initialConversations = (conversations ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    updated_at: c.updated_at,
  }));

  const nav = (
    <nav style={{ padding: "var(--space-4)", fontSize: "var(--text-sm)" }}>
      <Link href={`/projects/${id}`} style={{ display: "block", color: "var(--color-text-muted)", textDecoration: "none" }}>
        ← Dashboard
      </Link>
    </nav>
  );

  return (
    <AppShell sidebar={nav}>
      <PageHeader title="Threads" description={`Conversations for ${project.name}`} />
      <div style={{ padding: "var(--space-8)", maxWidth: "56rem" }}>
        <ThreadsListClient projectId={id} initialConversations={initialConversations} />
      </div>
    </AppShell>
  );
}
