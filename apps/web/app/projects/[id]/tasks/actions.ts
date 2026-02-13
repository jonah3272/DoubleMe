"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId, isUuid } from "@/lib/validators";

const STATUSES = ["todo", "in_progress", "done", "cancelled"] as const;
export type TaskStatus = (typeof STATUSES)[number];

export type TaskResult = { ok: true; id: string } | { ok: false; error: string };
export type VoidResult = { ok: true } | { ok: false; error: string };

export async function createTask(
  projectId: string,
  data: { title: string; status?: TaskStatus; assignee_id?: string | null; due_at?: string | null; notes?: string | null; source_meeting_label?: string | null }
): Promise<TaskResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const status = data.status && STATUSES.includes(data.status) ? data.status : "todo";
  const { data: row, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title: data.title.trim(),
      status,
      assignee_id: data.assignee_id || null,
      due_at: data.due_at || null,
      notes: data.notes?.trim() || null,
      source_meeting_label: data.source_meeting_label?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Failed to create task." };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);
  return { ok: true, id: row.id };
}

export async function updateTask(
  projectId: string,
  taskId: string,
  data: { title?: string; status?: TaskStatus; assignee_id?: string | null; due_at?: string | null; notes?: string | null }
): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(taskId)) return { ok: false, error: "Invalid project or task." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.status !== undefined && STATUSES.includes(data.status)) payload.status = data.status;
  if (data.assignee_id !== undefined) payload.assignee_id = data.assignee_id || null;
  if (data.due_at !== undefined) payload.due_at = data.due_at || null;
  if (data.notes !== undefined) payload.notes = data.notes?.trim() || null;
  const { error } = await supabase.from("tasks").update(payload).eq("id", taskId).eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);
  return { ok: true };
}

export type BulkCreateResult = { ok: true; count: number } | { ok: false; error: string };

export async function createTasksFromLines(
  projectId: string,
  lines: { title: string; due_at?: string | null; assignee_id?: string | null; source_meeting_label?: string | null }[]
): Promise<BulkCreateResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  let count = 0;
  for (const line of lines) {
    const title = line.title.trim();
    if (!title) continue;
    const { error } = await supabase.from("tasks").insert({
      project_id: projectId,
      title,
      status: "todo",
      assignee_id: line.assignee_id || null,
      due_at: line.due_at || null,
      notes: null,
      source_meeting_label: line.source_meeting_label?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
    count++;
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);
  return { ok: true, count };
}

export async function deleteTask(projectId: string, taskId: string): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(taskId)) return { ok: false, error: "Invalid project or task." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);
  return { ok: true };
}
