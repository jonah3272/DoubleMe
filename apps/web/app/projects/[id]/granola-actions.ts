"use server";

import {
  listGranolaDocuments,
  listGranolaMcpTools,
  getGranolaTranscriptFull,
  parseActionItemsFromTranscript,
  parseActionItemsFromMarkdownSummary,
} from "@/lib/granola-mcp";
import { synthesizeTranscriptWithKimi, extractMeetingsFromRawText } from "@/lib/kimi";
import { createTasksFromLines } from "./tasks/actions";
import { createArtifact } from "./artifacts/actions";
import { isValidProjectId } from "@/lib/validators";
import { getCurrentUser } from "@/lib/supabase/server";
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

export type ImportFromGranolaOptions = {
  createTasks: boolean;
  createNote: boolean;
  taskDueAt?: "today" | "week";
  /** When set, used as the note body (if createNote) and for task extraction (if createTasks) instead of raw transcript. */
  synthesizedSummary?: string;
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
    const accessToken = await getGranolaAccessTokenForUser(user.id);
    const transcript = await getGranolaTranscriptFull(documentId, accessToken ?? undefined);
    let tasksCreated: number | undefined;
    let artifactId: string | undefined;

    if (options.createTasks) {
      const titles = options.synthesizedSummary?.trim()
        ? parseActionItemsFromMarkdownSummary(options.synthesizedSummary)
        : parseActionItemsFromTranscript(transcript.content);
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
