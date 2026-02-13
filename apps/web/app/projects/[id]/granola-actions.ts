"use server";

import {
  listGranolaDocuments,
  listGranolaMcpTools,
  getGranolaTranscriptFull,
  parseActionItemsFromTranscript,
  parseActionItemsWithOwnersFromMarkdownSummary,
} from "@/lib/granola-mcp";
import { synthesizeTranscriptWithKimi, extractMeetingsFromRawText, askKimiAboutData } from "@/lib/kimi";
import { createTasksFromLines } from "./tasks/actions";
import { createArtifact } from "./artifacts/actions";
import { isValidProjectId } from "@/lib/validators";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  buildGranolaAuthorizeUrl,
  storeGranolaPending,
  getGranolaAccessTokenForUser,
  resetGranolaConnection,
} from "@/lib/granola-oauth";
import { getAppOriginOptional } from "@/lib/env";
import { randomBytes } from "crypto";

export type GranolaDocument = { id: string; title?: string; type?: string; created_at?: string; updated_at?: string };

export type ListGranolaResult =
  | { ok: true; documents: GranolaDocument[]; debug?: string; rawPreview?: string; extractedWithKimi?: boolean }
  | { ok: false; error: string };

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type GranolaConnectUrlResult = { ok: true; url: string } | { ok: false; error: string };

/** Get the OAuth URL to send the user to for "Connect to Granola" (like Claude). */
export async function getGranolaConnectUrl(): Promise<GranolaConnectUrlResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const origin = getAppOriginOptional();
  if (!origin) return { ok: false, error: "App URL not set. Set NEXT_PUBLIC_APP_URL or deploy to Vercel." };
  try {
    const state = base64UrlEncode(randomBytes(16));
    const codeVerifier = base64UrlEncode(randomBytes(32));
    const redirectUri = `${origin}/api/auth/granola/callback`;
    await storeGranolaPending(state, codeVerifier, user.id);
    const url = await buildGranolaAuthorizeUrl({ redirectUri, state, codeVerifier });
    return { ok: true, url };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to start Granola connection.";
    return { ok: false, error: message };
  }
}

export type GranolaConnectedResult = { ok: true; connected: boolean } | { ok: false; error: string };

/** Reset Granola OAuth so the next Connect runs as if first time (clears stored client + your token). */
export async function resetGranolaConnectionAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  try {
    await resetGranolaConnection(user.id);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Reset failed.";
    return { ok: false, error: message };
  }
}

/** Check if the current user has connected their Granola account (OAuth). */
export async function getGranolaConnected(): Promise<GranolaConnectedResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  try {
    const token = await getGranolaAccessTokenForUser(user.id);
    return { ok: true, connected: !!token };
  } catch {
    return { ok: true, connected: false };
  }
}

export type GranolaMcpToolsResult =
  | { ok: true; listTools: string[]; defaultListTool: string | null }
  | { ok: false; error: string };

/** List MCP tools so the user can choose which tool to use for listing meetings. */
export async function getGranolaMcpToolsForProject(): Promise<GranolaMcpToolsResult> {
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

export async function listGranolaDocumentsForProject(listTool?: string, searchQuery?: string): Promise<ListGranolaResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  try {
    const accessToken = await getGranolaAccessTokenForUser(user.id);
    const { documents, debug, rawPreview, rawFullText } = await listGranolaDocuments(
      accessToken ?? undefined,
      listTool ?? undefined,
      searchQuery ?? undefined
    );
    if (documents.length === 0 && rawFullText) {
      const extracted = await extractMeetingsFromRawText(rawFullText);
      if (extracted.ok && extracted.meetings.length > 0) {
        const mapped: GranolaDocument[] = extracted.meetings.map((m) => ({ id: m.id, title: m.title }));
        return {
          ok: true,
          documents: mapped,
          debug,
          rawPreview,
          extractedWithKimi: true,
        };
      }
    }
    return { ok: true, documents, debug, rawPreview };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list Granola documents.";
    return { ok: false, error: message };
  }
}

export type GetTranscriptResult =
  | { ok: true; title: string; content: string; created_at?: string }
  | { ok: false; error: string };

/** Fetch a single meeting transcript by id (for the import page). */
export async function getGranolaTranscriptForProject(documentId: string): Promise<GetTranscriptResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  try {
    const accessToken = await getGranolaAccessTokenForUser(user.id);
    const transcript = await getGranolaTranscriptFull(documentId, accessToken ?? undefined);
    return {
      ok: true,
      title: transcript.title,
      content: transcript.content,
      created_at: transcript.created_at,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load transcript.";
    return { ok: false, error: message };
  }
}

export type SynthesizeResult = { ok: true; content: string } | { ok: false; error: string };

/** Synthesize transcript into a readable summary using Kimi. */
export async function synthesizeGranolaTranscriptAction(title: string, rawContent: string): Promise<SynthesizeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return synthesizeTranscriptWithKimi(title, rawContent);
}

/** Ask Kimi a question about the given data (e.g. transcript); returns Kimi's reply. */
export async function askKimiAboutTranscriptAction(
  contextTitle: string,
  contextContent: string,
  userMessage: string
): Promise<SynthesizeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return askKimiAboutData(contextTitle, contextContent, userMessage);
}

/** Pick the closest contact for an owner string (e.g. from "**Sam:** do X"). Case-insensitive; prefers first-name match. */
function matchOwnerToContact(
  owner: string,
  contacts: { id: string; name: string; email?: string | null }[]
): string | null {
  const q = owner.trim().toLowerCase();
  if (!q) return null;
  const byName = (c: { name: string }) => c.name.trim().toLowerCase();
  const exact = contacts.find((c) => byName(c) === q);
  if (exact) return exact.id;
  const firstWord = q.split(/\s+/)[0];
  const startsWith = contacts.find((c) => byName(c).startsWith(firstWord) || firstWord.length >= 2 && byName(c).includes(firstWord));
  if (startsWith) return startsWith.id;
  const includes = contacts.find((c) => byName(c).includes(q) || q.split(/\s+/).every((w) => w.length >= 2 && byName(c).includes(w)));
  if (includes) return includes.id;
  const emailMatch = contacts.find((c) => c.email && c.email.toLowerCase().startsWith(q));
  if (emailMatch) return emailMatch.id;
  return null;
}

export type TaskItemForImport = { title: string; assignee_id: string | null };

export type ImportFromGranolaOptions = {
  createTasks: boolean;
  createNote: boolean;
  taskDueAt?: "today" | "week";
  /** When set, used as the note body (if createNote) and for task extraction (if createTasks) instead of raw transcript. */
  synthesizedSummary?: string;
  /** When createTasks is true, use these instead of parsing from summary (allows preview + overwrite). */
  taskItems?: TaskItemForImport[];
};

export type ActionItemWithSuggestedAssignee = {
  title: string;
  owner_from_summary: string | null;
  suggested_assignee_id: string | null;
  suggested_assignee_name: string | null;
};

export type ContactOption = { id: string; name: string };

export type GetActionItemsWithSuggestedAssigneesResult =
  | { ok: true; items: ActionItemWithSuggestedAssignee[]; contacts: ContactOption[] }
  | { ok: false; error: string };

/** Parse action items from the summary and suggest assignees by matching owner names to project contacts. */
export async function getActionItemsWithSuggestedAssignees(
  projectId: string,
  synthesizedSummary: string
): Promise<GetActionItemsWithSuggestedAssigneesResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, email")
    .eq("project_id", projectId)
    .order("name")
    .limit(100);
  const list = contacts ?? [];
  const items = parseActionItemsWithOwnersFromMarkdownSummary(synthesizedSummary.trim());
  const result: ActionItemWithSuggestedAssignee[] = items.map((item) => {
    const suggested_assignee_id = item.owner ? matchOwnerToContact(item.owner, list) : null;
    const suggested_assignee_name = suggested_assignee_id
      ? list.find((c) => c.id === suggested_assignee_id)?.name ?? null
      : null;
    return {
      title: item.title,
      owner_from_summary: item.owner ?? null,
      suggested_assignee_id,
      suggested_assignee_name,
    };
  });
  return {
    ok: true,
    items: result,
    contacts: list.map((c) => ({ id: c.id, name: c.name })),
  };
}

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
    const supabase = await createClient();
    const accessToken = await getGranolaAccessTokenForUser(user.id);
    const transcript = await getGranolaTranscriptFull(documentId, accessToken ?? undefined);
    let tasksCreated: number | undefined;
    let artifactId: string | undefined;

    if (options.createTasks) {
      const now = new Date();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const dayOfWeek = now.getDay();
      const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek);
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday, 23, 59, 59).toISOString();
      const due_at = options.taskDueAt === "today" ? endOfToday : endOfWeek;

      if (options.taskItems && options.taskItems.length > 0) {
        const lines = options.taskItems.map((t) => ({ title: t.title.trim(), due_at, assignee_id: t.assignee_id || null }));
        const result = await createTasksFromLines(projectId, lines.filter((l) => l.title.length > 0));
        if (!result.ok) return { ok: false, error: result.error };
        tasksCreated = result.count;
      } else {
        const items = options.synthesizedSummary?.trim()
          ? parseActionItemsWithOwnersFromMarkdownSummary(options.synthesizedSummary)
          : parseActionItemsFromTranscript(transcript.content).map((title) => ({ title }));
        if (items.length > 0) {
          const { data: contacts } = await supabase
            .from("contacts")
            .select("id, name, email")
            .eq("project_id", projectId)
            .order("name")
            .limit(100);
          const list = contacts ?? [];
          const lines = items.map((item) => {
            const title = "title" in item ? item.title : "";
            const ownerStr = "owner" in item && typeof (item as { owner?: string }).owner === "string" ? (item as { owner: string }).owner : null;
            return {
              title,
              due_at,
              assignee_id: ownerStr ? matchOwnerToContact(ownerStr, list) : null,
            };
          });
          const result = await createTasksFromLines(projectId, lines);
          if (!result.ok) return { ok: false, error: result.error };
          tasksCreated = result.count;
        }
      }
    }

    if (options.createNote) {
      const noteBody = options.synthesizedSummary?.trim() || transcript.content;
      const art = await createArtifact(projectId, {
        title: transcript.title,
        body: noteBody,
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
