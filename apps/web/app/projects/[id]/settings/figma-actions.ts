"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId, isUuid } from "@/lib/validators";

export type FigmaResult = { ok: true; id: string } | { ok: false; error: string };
export type VoidResult = { ok: true } | { ok: false; error: string };

export async function createFigmaLink(
  projectId: string,
  data: { url: string; name?: string }
): Promise<FigmaResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const url = data.url.trim();
  if (!url) return { ok: false, error: "URL is required." };
  const { data: row, error } = await supabase
    .from("figma_links")
    .insert({
      project_id: projectId,
      url,
      name: data.name?.trim() || "",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Failed to create link." };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true, id: row.id };
}

export async function deleteFigmaLink(projectId: string, linkId: string): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(linkId)) return { ok: false, error: "Invalid project or link." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("figma_links")
    .delete()
    .eq("id", linkId)
    .eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true };
}
