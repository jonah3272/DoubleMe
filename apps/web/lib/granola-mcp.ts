/**
 * Minimal MCP client to call Granola MCP (https://mcp.granola.ai/mcp).
 * Used server-side only to list documents/transcripts and get content for importing tasks.
 */

import { getGranolaMcpUrlOptional, getGranolaApiTokenOptional } from "@/lib/env";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
};

async function postMessage(url: string, token: string | undefined, message: JsonRpcRequest): Promise<JsonRpcResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    throw new Error(`Granola MCP: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as JsonRpcResponse;
  if (data.error) {
    throw new Error(`Granola MCP: ${data.error.message}`);
  }
  return data;
}

/** Ensure we've done the initialize handshake; returns true if the server is reachable. */
async function ensureInitialized(url: string, token: string | undefined): Promise<void> {
  await postMessage(url, token, {
    jsonrpc: "2.0",
    id: "init-1",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "doubleme-web", version: "0.1.0" },
    },
  });
}

export type GranolaDocument = {
  id: string;
  title?: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
};

/** List tools from Granola MCP and call the one that lists documents/transcripts. */
export async function listGranolaDocuments(): Promise<GranolaDocument[]> {
  const url = getGranolaMcpUrlOptional();
  if (!url) throw new Error("Granola MCP URL is not set.");
  const token = getGranolaApiTokenOptional();

  await ensureInitialized(url, token);

  const listRes = await postMessage(url, token, {
    jsonrpc: "2.0",
    id: "tools-list",
    method: "tools/list",
    params: {},
  });

  const tools = (listRes.result as { tools?: { name: string }[] })?.tools ?? [];
  const toolNames = tools.map((t) => t.name);

  // Prefer tools that list documents or transcripts (Granola community/official naming)
  const listTool =
    toolNames.find((n) => n === "list_granola_documents") ??
    toolNames.find((n) => n === "search_granola_transcripts") ??
    toolNames.find((n) => n.includes("list") && n.toLowerCase().includes("granola"));

  if (!listTool) {
    throw new Error("Granola MCP does not expose a list documents/transcripts tool. Available: " + toolNames.join(", ") || "none");
  }

  const listArgs = listTool === "list_granola_documents" ? { limit: 100 } : {};
  const callRes = await postMessage(url, token, {
    jsonrpc: "2.0",
    id: "tools-call-list",
    method: "tools/call",
    params: {
      name: listTool,
      arguments: listArgs,
    },
  });

  const content = (callRes.result as { content?: { type: string; text?: string }[] })?.content;
  if (!content?.length || content[0].type !== "text") return [];
  const text = content[0].text ?? "";
  try {
    // Granola MCP returns { count, documents: [{ id, title, created_at, updated_at }] } for list_granola_documents
    const parsed = JSON.parse(text) as GranolaDocument[] | { documents?: GranolaDocument[]; transcripts?: GranolaDocument[] };
    if (Array.isArray(parsed)) return parsed;
    if (parsed.documents?.length) return parsed.documents;
    if (parsed.transcripts?.length) return parsed.transcripts;
    return [];
  } catch {
    return [];
  }
}

export type GranolaTranscriptFull = { title: string; content: string; created_at?: string; updated_at?: string };

/** Get one transcript by ID; returns full object for creating tasks and notes. */
export async function getGranolaTranscriptFull(documentId: string): Promise<GranolaTranscriptFull> {
  const url = getGranolaMcpUrlOptional();
  if (!url) throw new Error("Granola MCP URL is not set.");
  const token = getGranolaApiTokenOptional();

  await ensureInitialized(url, token);

  const listRes = await postMessage(url, token, {
    jsonrpc: "2.0",
    id: "tools-list-2",
    method: "tools/list",
    params: {},
  });
  const tools = (listRes.result as { tools?: { name: string }[] })?.tools ?? [];
  const getTool =
    tools.find((t) => t.name === "get_granola_transcript") ??
    tools.find((t) => t.name === "get_granola_document") ??
    tools.find((t) => t.name.includes("get") && t.name.toLowerCase().includes("granola"));

  if (!getTool) throw new Error("Granola MCP does not expose get transcript/document tool.");

  const callRes = await postMessage(url, token, {
    jsonrpc: "2.0",
    id: "tools-call-get",
    method: "tools/call",
    params: {
      name: getTool.name,
      arguments: { id: documentId },
    },
  });

  const content = (callRes.result as { content?: { type: string; text?: string }[] })?.content;
  if (!content?.length || content[0].type !== "text") throw new Error("Empty transcript response.");
  const text = content[0].text ?? "";
  try {
    const parsed = JSON.parse(text) as {
      title?: string;
      content?: string;
      text?: string;
      created_at?: string;
      updated_at?: string;
      error?: string;
    };
    if (parsed.error) throw new Error(parsed.error);
    return {
      title: parsed.title?.trim() || "Meeting transcript",
      content: parsed.content ?? parsed.text ?? "",
      created_at: parsed.created_at,
      updated_at: parsed.updated_at,
    };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("Invalid transcript response.");
  }
}

/** Get one transcript by ID and return its text content (for parsing action items). */
export async function getGranolaTranscriptContent(documentId: string): Promise<string> {
  const full = await getGranolaTranscriptFull(documentId);
  return full.content;
}

/** Heuristic: extract action-item-like lines from markdown or plain text. */
export function parseActionItemsFromTranscript(content: string): string[] {
  const lines = content.split(/\n/);
  const items: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Common patterns: "- Do X", "* Do X", "• Action: X", "1. X", "- [ ] X", "TODO: X", "Action items: ..." then indented
    const bullet = trimmed.replace(/^[-*•]\s*/, "").replace(/^\[\s*\]\s*/, "").replace(/^\d+\.\s*/, "");
    const afterColon = /^(?:action|todo|task):\s*(.+)$/i.exec(bullet);
    const action = afterColon ? afterColon[1].trim() : bullet.trim();
    if (action.length > 2 && action.length < 500) items.push(action);
  }
  return [...new Set(items)].slice(0, 50);
}
