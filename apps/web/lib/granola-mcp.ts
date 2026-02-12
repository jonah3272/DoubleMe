/**
 * Minimal MCP client to call Granola MCP (https://mcp.granola.ai/mcp).
 * Used server-side only to list documents/transcripts and get content for importing tasks/notes.
 *
 * Official mcp.granola.ai uses OAuth 2.0 (browser sign-in per user; no API key). We support
 * an optional GRANOLA_API_TOKEN (e.g. a bearer token from another tool’s OAuth flow) for
 * server-side requests.
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
    // MCP Streamable HTTP requires both; server may return 406 if only application/json
    Accept: "application/json, text/event-stream",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        "Granola MCP requires sign-in (401). The official server uses OAuth — there is no API key. If you have a bearer token from another tool, set GRANOLA_API_TOKEN in .env.local."
      );
    }
    if (res.status === 406) {
      throw new Error(
        "Granola MCP returned 406 Not Acceptable. The app was updated to send the correct Accept header; try again or reconnect in Settings."
      );
    }
    throw new Error(`Granola MCP: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  let data: JsonRpcResponse;
  if (contentType.includes("text/event-stream")) {
    // Server may send one or more SSE events; each data: line is usually one JSON-RPC message
    const lines = text.split(/\n/);
    const requestId = message.id;
    const validResponses: JsonRpcResponse[] = [];
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trimStart();
      if (!jsonStr || jsonStr === "[DONE]" || jsonStr.startsWith("[")) continue;
      try {
        const parsed = JSON.parse(jsonStr) as JsonRpcResponse;
        if (parsed.jsonrpc === "2.0" && (parsed.result !== undefined || parsed.error !== undefined)) {
          validResponses.push(parsed);
        }
      } catch {
        /* skip malformed line */
      }
    }
    const matching = validResponses.find((r) => r.id === requestId);
    const lastValid = matching ?? validResponses[validResponses.length - 1] ?? null;
    if (!lastValid) throw new Error("Granola MCP: no valid JSON-RPC message in SSE response");
    data = lastValid;
  } else {
    try {
      data = JSON.parse(text) as JsonRpcResponse;
    } catch {
      throw new Error(`Granola MCP: invalid JSON response`);
    }
  }

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

/** Tool names that can list meetings/documents (in preference order). */
const LIST_TOOL_PRIORITY = [
  "search_meetings",
  "list_granola_documents",
  "list_meetings",
  "query_granola_meetings",
  "get_meetings",
  "search_granola_transcripts",
];

function pickListTool(toolNames: string[], preferred?: string): string | null {
  if (preferred && toolNames.includes(preferred)) return preferred;
  for (const name of LIST_TOOL_PRIORITY) {
    if (toolNames.includes(name)) return name;
  }
  const listLike = toolNames.find(
    (n) =>
      n.includes("list") && (n.toLowerCase().includes("granola") || n.toLowerCase().includes("meeting"))
  );
  if (listLike) return listLike;
  const searchGet = toolNames.find(
    (n) => /search|list|query|get/.test(n) && n.toLowerCase().includes("meeting")
  );
  if (searchGet) return searchGet;
  const anyMeeting = toolNames.find(
    (n) =>
      n.toLowerCase().includes("meeting") &&
      !n.toLowerCase().includes("transcript") &&
      !n.toLowerCase().includes("document")
  );
  return anyMeeting ?? null;
}

/** Return MCP tool names: all tools and those suitable for listing meetings/documents. */
export async function listGranolaMcpTools(accessToken?: string): Promise<{
  allTools: string[];
  listTools: string[];
  defaultListTool: string | null;
}> {
  const url = getGranolaMcpUrlOptional();
  if (!url) throw new Error("Granola MCP URL is not set.");
  const token = accessToken ?? getGranolaApiTokenOptional();
  await ensureInitialized(url, token);
  const listRes = await postMessage(url, token, {
    jsonrpc: "2.0",
    id: "tools-list",
    method: "tools/list",
    params: {},
  });
  const tools = (listRes.result as { tools?: { name: string }[] })?.tools ?? [];
  const allTools = tools.map((t) => t.name);
  const defaultListTool = pickListTool(allTools);
  return { allTools, listTools: allTools, defaultListTool };
}

/** List tools from Granola MCP and call the one that lists documents/transcripts. */
export async function listGranolaDocuments(
  accessToken?: string,
  preferredListTool?: string
): Promise<GranolaDocument[]> {
  const url = getGranolaMcpUrlOptional();
  if (!url) throw new Error("Granola MCP URL is not set.");
  const token = accessToken ?? getGranolaApiTokenOptional();

  await ensureInitialized(url, token);

  const listRes = await postMessage(url, token, {
    jsonrpc: "2.0",
    id: "tools-list",
    method: "tools/list",
    params: {},
  });

  const tools = (listRes.result as { tools?: { name: string }[] })?.tools ?? [];
  const toolNames = tools.map((t) => t.name);

  const listTool = pickListTool(toolNames, preferredListTool ?? undefined);

  if (!listTool) {
    throw new Error("Granola MCP does not expose a list documents/transcripts tool. Available: " + (toolNames.length ? toolNames.join(", ") : "none"));
  }

  // search_meetings: query, limit; list_meetings / list_granola_documents / get_meetings / query_granola_meetings: limit or {}
  const listArgs =
    listTool === "search_meetings"
      ? { query: "", limit: 100 }
      : listTool === "list_granola_documents" ||
          listTool === "get_meetings" ||
          listTool === "query_granola_meetings" ||
          listTool === "list_meetings"
        ? { limit: 100 }
        : {};
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
    // search_meetings: { meetings? } or { results? }; list_granola_documents: { documents }; etc.
    const parsed = JSON.parse(text) as
      | Record<string, unknown>[]
      | {
          documents?: Record<string, unknown>[];
          transcripts?: Record<string, unknown>[];
          meetings?: Record<string, unknown>[];
          results?: Record<string, unknown>[];
        };
    const raw: Record<string, unknown>[] = Array.isArray(parsed)
      ? parsed
      : parsed.documents ?? parsed.transcripts ?? parsed.meetings ?? parsed.results ?? [];
    return raw.map(normalizeGranolaDocument);
  } catch {
    return [];
  }
}

function normalizeGranolaDocument(item: Record<string, unknown>): GranolaDocument {
  const id = String(item.id ?? item.meeting_id ?? item.document_id ?? "");
  const title = [item.title, item.name, item.subject].find((t) => t != null) as string | undefined;
  return {
    id,
    title: title != null ? String(title) : undefined,
    type: item.type != null ? String(item.type) : undefined,
    created_at: item.created_at != null ? String(item.created_at) : undefined,
    updated_at: item.updated_at != null ? String(item.updated_at) : undefined,
  };
}

export type GranolaTranscriptFull = { title: string; content: string; created_at?: string; updated_at?: string };

/** Get one transcript by ID; returns full object for creating tasks and notes. */
export async function getGranolaTranscriptFull(documentId: string, accessToken?: string): Promise<GranolaTranscriptFull> {
  const url = getGranolaMcpUrlOptional();
  if (!url) throw new Error("Granola MCP URL is not set.");
  const token = accessToken ?? getGranolaApiTokenOptional();

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
    tools.find((t) => t.name === "get_meeting_transcript") ??
    tools.find((t) => t.name === "get_granola_document") ??
    tools.find((t) => t.name.includes("get") && (t.name.toLowerCase().includes("granola") || t.name.toLowerCase().includes("meeting") && t.name.toLowerCase().includes("transcript")));

  if (!getTool) throw new Error("Granola MCP does not expose get transcript/document tool.");

  // get_meeting_transcript may use meeting_id or id
  const getArgs = getTool.name === "get_meeting_transcript"
    ? { meeting_id: documentId }
    : { id: documentId };

  const callRes = await postMessage(url, token, {
    jsonrpc: "2.0",
    id: "tools-call-get",
    method: "tools/call",
    params: {
      name: getTool.name,
      arguments: getArgs,
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
export async function getGranolaTranscriptContent(documentId: string, accessToken?: string): Promise<string> {
  const full = await getGranolaTranscriptFull(documentId, accessToken);
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
