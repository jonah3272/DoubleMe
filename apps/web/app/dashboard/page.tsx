import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isAuthBypass } from "@/lib/auth-bypass";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const supabase = await createClient();
  let query = supabase.from("projects").select("id, name").order("updated_at", { ascending: false });
  if (isAuthBypass()) {
    query = query.eq("owner_id", user.id);
  }
  const { data: projects } = await query;
  const singleProject = projects?.length === 1 ? projects[0] : null;

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description={singleProject ? "Your workspace and tools." : "Your projects and recent activity."}
        actions={
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        }
      />
      <div style={{ padding: "var(--space-8)" }}>
        <p style={{ color: "var(--color-text-muted)", margin: "0 0 var(--space-4) 0" }}>
          Signed in as {user.email ?? "—"}.
        </p>
        {singleProject ? (
          <Link
            href={`/projects/${singleProject.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 48,
              padding: "0 var(--space-6)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-medium)",
              color: "var(--color-inverse)",
              backgroundColor: "var(--color-primary)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              textDecoration: "none",
              boxShadow: "var(--shadow-md)",
            }}
          >
            Open workspace
          </Link>
        ) : (
          <Link
            href="/projects"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 48,
              padding: "0 var(--space-6)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-medium)",
              color: "var(--color-inverse)",
              backgroundColor: "var(--color-primary)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              textDecoration: "none",
              boxShadow: "var(--shadow-md)",
            }}
          >
            Projects
          </Link>
        )}
      </div>
    </AppShell>
  );
}
