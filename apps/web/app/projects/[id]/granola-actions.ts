"use server";

import { listGranolaDocuments, getGranolaTranscriptFull, parseActionItemsFromTranscript } from "@/lib/granola-mcp";
import { createTasksFromLines } from "./tasks/actions";
import { createArtifact } from "./artifacts/actions";
import { isValidProjectId } from "@/lib/validators";
import { getCurrentUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type GranolaDocument = { id: string; title?: string; type?: string; created_at?: string; updated_at?: string };

export type ListGranolaResult = { ok: true; documents: GranolaDocument[] } | { ok: false; error: string };

export async function listGranolaDocumentsForProject(): Promise<ListGranolaResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  try {
    const documents = await listGranolaDocuments();
    return { ok: true, documents };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list Granola documents.";
    return { ok: false, error: message };
  }
}

export type ImportFromGranolaOptions = {
  createTasks: boolean;
  createNote: boolean;
  taskDueAt?: "today" | "week";
};

export type ImportFromGranolaResult =
  | { ok: true; tasksCreated?: number; artifactId?: string }
  | { ok: false; error: string };

export async function importFromGranolaIntoProject(
  projectId: string,
  documentId: string,
  options: ImportFromGranolaOptions
): Promise<ImportFromGranolaResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!options.createTasks && !options.createNote)
    return { ok: false, error: "Choose at least one: create tasks or save as note." };

  try {
    const transcript = await getGranolaTranscriptFull(documentId);
    let tasksCreated: number | undefined;
    let artifactId: string | undefined;

    if (options.createTasks) {
      const titles = parseActionItemsFromTranscript(transcript.content);
      if (titles.length > 0) {
        const now = new Date();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
        const dayOfWeek = now.getDay();
        const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek);
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday, 23, 59, 59).toISOString();
        const due_at = options.taskDueAt === "today" ? endOfToday : endOfWeek;
        const result = await createTasksFromLines(projectId, titles.map((title) => ({ title, due_at })));
        if (!result.ok) return { ok: false, error: result.error };
        tasksCreated = result.count;
      }
    }

    if (options.createNote) {
      const art = await createArtifact(projectId, {
        title: transcript.title,
        body: transcript.content,
        artifact_type: "meeting_summary",
        occurred_at: transcript.created_at ?? null,
      });
      if (!art.ok) return { ok: false, error: art.error };
      artifactId = art.id;
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/tasks`);
    revalidatePath(`/projects/${projectId}/artifacts`);
    return { ok: true, tasksCreated, artifactId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to import from Granola.";
    return { ok: false, error: message };
  }
}
