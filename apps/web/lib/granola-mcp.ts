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
    // Prefer last response with matching id (streaming may send multiple events with same id)
    const matching = validResponses.filter((r) => r.id === requestId);
    const lastValid = matching.length > 0 ? matching[matching.length - 1] : validResponses[validResponses.length - 1] ?? null;
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

/** Tools that fetch a single transcript by ID — must not be offered as "list" tools. */
const LIST_TOOL_EXCLUDE = new Set([
  "get_meeting_transcript",
  "get_granola_transcript",
  "get_granola_document",
  "get_transcript",
]);

/** Return only tool names that are suitable for listing meetings (excludes single-item fetch tools). */
function getListToolNames(toolNames: string[]): string[] {
  return toolNames.filter(
    (n) =>
      !LIST_TOOL_EXCLUDE.has(n) &&
      (LIST_TOOL_PRIORITY.includes(n) ||
        (n.includes("list") && (n.toLowerCase().includes("granola") || n.toLowerCase().includes("meeting"))) ||
        (/search|list|query/.test(n) && n.toLowerCase().includes("meeting")) ||
        (n.toLowerCase().includes("meeting") &&
          !n.toLowerCase().includes("transcript") &&
          !n.toLowerCase().includes("document")))
  );
}

function pickListTool(toolNames: string[], preferred?: string): string | null {
  const listTools = getListToolNames(toolNames);
  if (preferred && listTools.includes(preferred)) return preferred;
  for (const name of LIST_TOOL_PRIORITY) {
    if (listTools.includes(name)) return name;
  }
  return listTools[0] ?? null;
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
  const listTools = getListToolNames(allTools);
  const defaultListTool = pickListTool(allTools);
  return { allTools, listTools, defaultListTool };
}

export type ListGranolaDocumentsResult = { documents: GranolaDocument[]; debug?: string };

/** List tools from Granola MCP and call the one that lists documents/transcripts. */
export async function listGranolaDocuments(
  accessToken?: string,
  preferredListTool?: string,
  searchQuery?: string
): Promise<ListGranolaDocumentsResult> {
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
  const allNames = tools.map((t) => t.name);
  const listToolNames = getListToolNames(allNames);
  const listTool = preferredListTool && listToolNames.includes(preferredListTool)
    ? preferredListTool
    : pickListTool(allNames);

  if (!listTool) {
    throw new Error("Granola MCP does not expose a list documents/transcripts tool. Available: " + (toolNames.length ? toolNames.join(", ") : "none"));
  }

  // Official Granola: list_meetings / get_meetings accept limit; optional query for natural-language filter (e.g. "meetings with Sam last week")
  const listArgs =
    listTool === "search_meetings"
      ? { query: (searchQuery?.trim() || "*"), limit: 100 }
      : listTool === "list_granola_documents"
        ? { limit: 100 }
        : listTool === "list_meetings" || listTool === "get_meetings" || listTool === "query_granola_meetings"
          ? { limit: 50, ...(searchQuery?.trim() ? { query: searchQuery.trim() } : {}) }
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

  const text = extractTextFromToolResult(callRes.result);
  if (!text) {
    const rawPreview =
      typeof callRes.result === "string"
        ? callRes.result.slice(0, 800)
        : JSON.stringify(callRes.result ?? {}).slice(0, 800);
    const debug =
      process.env.GRANOLA_DEBUG
        ? `No text in response. Raw (first 800 chars): ${rawPreview}`
        : `No text in MCP response. Tool: ${listTool}. Add GRANOLA_DEBUG=1 to .env.local and restart to see raw response.`;
    if (process.env.GRANOLA_DEBUG) {
      console.warn("[Granola MCP] list tool returned no text:", listTool, callRes.result);
    }
    return { documents: [], debug };
  }

  const raw = parseListResponse(text);
  const documents = raw
    .map(normalizeGranolaDocument)
    .filter((d) => d.id || d.title);

  const alwaysDebugWhenEmpty =
    documents.length === 0
      ? process.env.GRANOLA_DEBUG
        ? `Tool: ${listTool}. Args: ${JSON.stringify(listArgs)}. Text length: ${text.length}. First 800 chars:\n${text.slice(0, 800)}`
        : `Tool: ${listTool}. Response: ${text.length} chars. No parseable meetings. Add GRANOLA_DEBUG=1 to .env.local and restart to see raw MCP response.`
      : undefined;
  if (documents.length === 0 && process.env.GRANOLA_DEBUG) {
    console.warn("[Granola MCP] list response (first 1200 chars):", text.slice(0, 1200));
  }

  return { documents, debug: alwaysDebugWhenEmpty };
}

/** Extract raw text from MCP tools/call result (content array or inline text). */
function extractTextFromToolResult(result: unknown): string {
  if (result == null) return "";
  const content = (result as { content?: { type?: string; text?: string; value?: string }[] })?.content;
  if (Array.isArray(content)) {
    const parts = content
      .filter((c) => c?.type === "text" || !c?.type)
      .map((c) => (c as { text?: string; value?: string }).text ?? (c as { value?: string }).value)
      .filter(Boolean) as string[];
    if (parts.length) return parts.join("\n");
  }
  if (typeof (result as { text?: string }).text === "string") return (result as { text: string }).text;
  if (typeof (result as { content?: string }).content === "string") return (result as { content: string }).content;
  if (typeof result === "string") return result;
  // If result is an object that might be the list wrapper, stringify so parseListResponse can try it
  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;
    for (const key of ["meetings", "meeting_list", "meetingList", "documents", "results", "items", "data"]) {
      if (Array.isArray(obj[key])) return JSON.stringify(result);
    }
  }
  return "";
}

/** Try to extract JSON string from markdown code block (e.g. ```json ... ```). */
function extractJsonFromText(text: string): string {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock?.[1]) return codeBlock[1].trim();
  return trimmed;
}

/** Parse tool response into array of item objects; handles many common response shapes. */
function parseListResponse(text: string): Record<string, unknown>[] {
  let toParse = extractJsonFromText(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(toParse);
  } catch {
    // Try to find JSON array or object in the text (preamble/formatting)
    const arrayStart = text.indexOf("[");
    const objectStart = text.indexOf("{");
    if (arrayStart >= 0 && (objectStart < 0 || arrayStart < objectStart)) {
      const end = text.lastIndexOf("]");
      if (end > arrayStart) {
        try {
          parsed = JSON.parse(text.slice(arrayStart, end + 1));
        } catch {
          return [];
        }
      } else {
        return [];
      }
    } else if (objectStart >= 0) {
      const end = text.lastIndexOf("}");
      if (end > objectStart) {
        try {
          parsed = JSON.parse(text.slice(objectStart, end + 1));
        } catch {
          return [];
        }
      } else {
        return [];
      }
    } else {
      return [];
    }
  }
  if (Array.isArray(parsed)) {
    const arr = parsed as unknown[];
    if (arr.length > 0 && typeof arr[0] === "object" && arr[0] !== null) return arr as Record<string, unknown>[];
    if (arr.length > 0 && (typeof arr[0] === "string" || typeof arr[0] === "number"))
      return arr.map((id) => ({ id: String(id), title: undefined }));
  }

  const obj = parsed as Record<string, unknown>;
  const knownKeys = [
    "documents",
    "transcripts",
    "meetings",
    "meeting_list",
    "meetingList",
    "results",
    "items",
    "data",
    "content",
    "hits",
    "list",
    "meeting_ids",
    "meetingIds",
  ];
  for (const key of knownKeys) {
    const val = obj[key];
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null) {
      return val as Record<string, unknown>[];
    }
  }
  // Any key whose value is an array of objects
  for (const value of Object.values(obj)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      return value as Record<string, unknown>[];
    }
  }
  // Nested: { data: { meetings: [...] } } or { response: { items: [...] } }
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const inner = parseListResponse(JSON.stringify(value));
      if (inner.length > 0) return inner;
    }
  }
  return [];
}

function normalizeGranolaDocument(item: Record<string, unknown>): GranolaDocument {
  const id = String(
    item.id ??
      item.meeting_id ??
      item.document_id ??
      item._id ??
      item.uuid ??
      (item as Record<string, unknown>).meetingId ??
      (() => {
        for (const [k, v] of Object.entries(item)) {
          if ((k === "id" || k.endsWith("_id") || k.endsWith("Id")) && v != null && String(v).trim()) return String(v);
        }
        return "";
      })()
  );
  const title = [
    item.title,
    item.name,
    item.subject,
    item.summary,
    (item as Record<string, unknown>).meeting_title,
    (item as Record<string, unknown>).meeting_title_override,
  ].find((t) => t != null) as string | undefined;
  const titleFallback =
    title ??
    (() => {
      for (const [k, v] of Object.entries(item)) {
        if ((k === "title" || k === "name" || k.includes("title") || k.includes("name")) && typeof v === "string" && v.trim()) return v;
      }
      return undefined;
    })();
  return {
    id,
    title: title != null ? String(title) : titleFallback ?? undefined,
    type: item.type != null ? String(item.type) : undefined,
    created_at:
      item.created_at != null
        ? String(item.created_at)
        : (item as Record<string, unknown>).meeting_date != null
          ? String((item as Record<string, unknown>).meeting_date)
          : (item as Record<string, unknown>).date != null
            ? String((item as Record<string, unknown>).date)
            : undefined,
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

  const text = extractTextFromToolResult(callRes.result);
  if (!text?.trim()) throw new Error("Empty transcript response.");
  try {
    const parsed = JSON.parse(extractJsonFromText(text)) as {
      title?: string;
      content?: string;
      text?: string;
      transcript?: string;
      created_at?: string;
      updated_at?: string;
      error?: string;
    };
    if (parsed.error) throw new Error(parsed.error);
    const content = parsed.content ?? parsed.text ?? parsed.transcript ?? "";
    return {
      title: parsed.title?.trim() || "Meeting transcript",
      content: typeof content === "string" ? content : "",
      created_at: parsed.created_at,
      updated_at: parsed.updated_at,
    };
  } catch (e) {
    if (e instanceof Error && e.message?.startsWith("Granola")) throw e;
    // Plain-text or non-JSON response: use whole text as transcript
    return {
      title: "Meeting transcript",
      content: text,
      created_at: undefined,
      updated_at: undefined,
    };
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
