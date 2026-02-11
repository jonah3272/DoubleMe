"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId, isUuid } from "@/lib/validators";

export type CreateConversationResult = { ok: true; id: string } | { ok: false; error: string };
export type VoidResult = { ok: true } | { ok: false; error: string };

export async function createConversation(projectId: string, title?: string | null): Promise<CreateConversationResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("conversations")
    .insert({ project_id: projectId, title: title?.trim() || null })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Failed to create thread." };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/threads`);
  return { ok: true, id: row.id };
}

export async function addMessage(
  projectId: string,
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string
): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(conversationId)) return { ok: false, error: "Invalid project or thread." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, role, content: content.trim() });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}/threads`);
  revalidatePath(`/projects/${projectId}/threads/${conversationId}`);
  return { ok: true };
}
