import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isAuthBypass } from "@/lib/auth-bypass";
import { ProjectsPageClient, type ProjectRow } from "./projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/projects");
  }

  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("id, owner_id, name, description, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (isAuthBypass()) {
    query = query.eq("owner_id", user.id);
  }
  const { data, error } = await query;

  const projects: ProjectRow[] = error ? [] : (data ?? []);

  // Single project: go straight to workspace (one big project, not agency)
  if (projects.length === 1) {
    redirect(`/projects/${projects[0].id}`);
  }

  return <ProjectsPageClient initialProjects={projects} />;
}
