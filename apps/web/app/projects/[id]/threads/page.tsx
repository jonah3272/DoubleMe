import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function ProjectThreadsPage({
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
      <div style={{ padding: "var(--space-8)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        <p style={{ margin: 0 }}>Threads and artifacts will appear here. Start a conversation from the dashboard or connect tools in Settings.</p>
        <Link href={`/projects/${id}`} style={{ display: "inline-block", marginTop: "var(--space-4)", color: "var(--color-primary)", textDecoration: "none" }}>
          Back to dashboard
        </Link>
      </div>
    </AppShell>
  );
}
