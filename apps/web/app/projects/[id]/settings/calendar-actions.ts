"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId, isUuid } from "@/lib/validators";

export type EventResult = { ok: true; id: string } | { ok: false; error: string };
export type VoidResult = { ok: true } | { ok: false; error: string };

export async function createCalendarEvent(
  projectId: string,
  data: { title: string; start_at: string; end_at: string; link?: string | null }
): Promise<EventResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("calendar_events")
    .insert({
      project_id: projectId,
      source: "manual",
      title: data.title.trim(),
      start_at: data.start_at,
      end_at: data.end_at,
      link: data.link?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Failed to create event." };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true, id: row.id };
}

export async function deleteCalendarEvent(projectId: string, eventId: string): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(eventId)) return { ok: false, error: "Invalid project or event." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true };
}
