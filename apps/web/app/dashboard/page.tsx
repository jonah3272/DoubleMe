import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Your projects and recent activity."
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
      </div>
    </AppShell>
  );
}
