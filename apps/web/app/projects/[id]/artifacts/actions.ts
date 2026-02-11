"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId, isUuid } from "@/lib/validators";

const TYPES = ["note", "meeting_summary", "plan", "design"] as const;
export type ArtifactType = (typeof TYPES)[number];

export type ArtifactResult = { ok: true; id: string } | { ok: false; error: string };
export type VoidResult = { ok: true } | { ok: false; error: string };

export async function createArtifact(
  projectId: string,
  data: { title: string; body?: string; artifact_type?: ArtifactType; occurred_at?: string | null }
): Promise<ArtifactResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const type = data.artifact_type && TYPES.includes(data.artifact_type) ? data.artifact_type : "note";
  const { data: row, error } = await supabase
    .from("artifacts")
    .insert({
      project_id: projectId,
      title: data.title.trim(),
      body: data.body?.trim() || "",
      artifact_type: type,
      occurred_at: data.occurred_at || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Failed to create artifact." };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/artifacts`);
  return { ok: true, id: row.id };
}

export async function updateArtifact(
  projectId: string,
  artifactId: string,
  data: { title?: string; body?: string; artifact_type?: ArtifactType; occurred_at?: string | null }
): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(artifactId)) return { ok: false, error: "Invalid project or artifact." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.body !== undefined) payload.body = data.body.trim();
  if (data.artifact_type !== undefined && TYPES.includes(data.artifact_type)) payload.artifact_type = data.artifact_type;
  if (data.occurred_at !== undefined) payload.occurred_at = data.occurred_at || null;
  const { error } = await supabase.from("artifacts").update(payload).eq("id", artifactId).eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/artifacts`);
  return { ok: true };
}

export async function deleteArtifact(projectId: string, artifactId: string): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(artifactId)) return { ok: false, error: "Invalid project or artifact." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase.from("artifacts").delete().eq("id", artifactId).eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/artifacts`);
  return { ok: true };
}
