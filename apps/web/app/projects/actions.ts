"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export type CreateProjectResult =
  | { ok: true; id: string; name: string; description: string | null; created_at: string; updated_at: string }
  | { ok: false; error: string };

export async function createProject(name: string, description: string | null): Promise<CreateProjectResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ owner_id: user.id, name: name.trim(), description: description?.trim() || null })
    .select("id, name, description, created_at, updated_at")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/projects");
  return {
    ok: true,
    id: data.id,
    name: data.name,
    description: data.description,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export type EnableToolResult = { ok: true } | { ok: false; error: string };

export async function enableProjectTool(projectId: string, agentKey: string): Promise<EnableToolResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_agents")
    .insert({ project_id: projectId, agent_key: agentKey, config: {} });

  if (error) {
    if (error.code === "23505") return { ok: true }; // already enabled
    return { ok: false, error: error.message };
  }
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function disableProjectTool(projectId: string, agentKey: string): Promise<EnableToolResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_agents")
    .delete()
    .eq("project_id", projectId)
    .eq("agent_key", agentKey);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
