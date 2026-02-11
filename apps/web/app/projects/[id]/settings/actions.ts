"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId, isUuid } from "@/lib/validators";

export type ContactResult = { ok: true; id: string } | { ok: false; error: string };
export type VoidResult = { ok: true } | { ok: false; error: string };

export async function createContact(
  projectId: string,
  data: { name: string; email?: string; role?: string; notes?: string }
): Promise<ContactResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("contacts")
    .insert({
      project_id: projectId,
      name: data.name.trim(),
      email: data.email?.trim() || null,
      role: data.role?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Failed to create contact." };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true, id: row.id };
}

export async function updateContact(
  projectId: string,
  contactId: string,
  data: { name: string; email?: string; role?: string; notes?: string }
): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(contactId)) return { ok: false, error: "Invalid project or contact." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      name: data.name.trim(),
      email: data.email?.trim() || null,
      role: data.role?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .eq("id", contactId)
    .eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true };
}

export async function deleteContact(projectId: string, contactId: string): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(contactId)) return { ok: false, error: "Invalid project or contact." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true };
}
