"use server";

import {
  listGranolaDocuments,
  listGranolaMcpTools,
  getGranolaTranscriptContent,
  parseActionItemsFromTranscript,
} from "@/lib/granola-mcp";
import { createTasksFromLines } from "./actions";
import { isValidProjectId } from "@/lib/validators";
import { getCurrentUser } from "@/lib/supabase/server";
import { getGranolaAccessTokenForUser } from "@/lib/granola-oauth";

export type GranolaDocument = { id: string; title?: string; type?: string; created_at?: string; updated_at?: string };

export type ListGranolaResult =
  | { ok: true; documents: GranolaDocument[]; debug?: string }
  | { ok: false; error: string };

export type GranolaMcpToolsResult =
  | { ok: true; listTools: string[]; defaultListTool: string | null }
  | { ok: false; error: string };

export async function getGranolaMcpToolsAction(): Promise<GranolaMcpToolsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  try {
    const accessToken = await getGranolaAccessTokenForUser(user.id);
    const { listTools, defaultListTool } = await listGranolaMcpTools(accessToken ?? undefined);
    return { ok: true, listTools, defaultListTool };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list Granola MCP tools.";
    return { ok: false, error: message };
  }
}

export async function listGranolaDocumentsAction(listTool?: string, searchQuery?: string): Promise<ListGranolaResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  try {
    const accessToken = await getGranolaAccessTokenForUser(user.id);
    const { documents, debug } = await listGranolaDocuments(
      accessToken ?? undefined,
      listTool ?? undefined,
      searchQuery ?? undefined
    );
    return { ok: true, documents, debug };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list Granola documents.";
    return { ok: false, error: message };
  }
}

export type ImportGranolaResult = { ok: true; count: number } | { ok: false; error: string };

export async function importTasksFromGranolaDocument(
  projectId: string,
  documentId: string,
  dueAt: "today" | "week"
): Promise<ImportGranolaResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  try {
    const accessToken = await getGranolaAccessTokenForUser(user.id);
    const content = await getGranolaTranscriptContent(documentId, accessToken ?? undefined);
    const titles = parseActionItemsFromTranscript(content);
    if (titles.length === 0) return { ok: false, error: "No action items found in this transcript." };
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const dayOfWeek = now.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek);
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday, 23, 59, 59).toISOString();
    const due_at = dueAt === "today" ? endOfToday : endOfWeek;
    const result = await createTasksFromLines(
      projectId,
      titles.map((title) => ({ title, due_at }))
    );
    return result.ok ? { ok: true, count: result.count } : { ok: false, error: result.error };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to import from Granola.";
    return { ok: false, error: message };
  }
}
