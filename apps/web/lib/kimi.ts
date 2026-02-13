/**
 * Kimi (Moonshot) API – OpenAI-compatible chat completion.
 * Used to synthesize meeting transcripts into readable summaries.
 * Set KIMI_API_KEY in .env or .env.local (get key from https://platform.moonshot.ai).
 */

import { getKimiApiKeyOptional } from "@/lib/env";

const KIMI_API_BASE = "https://api.moonshot.ai/v1";

function kimiKeyMissingMessage(): string {
  if (process.env.VERCEL) {
    return "KIMI_API_KEY is not set. In Vercel: Project → Settings → Environment Variables, add KIMI_API_KEY for Production, then redeploy.";
  }
  return "KIMI_API_KEY is not set. Add it to .env or .env.local to use this.";
}
const MODEL = "kimi-k2-turbo-preview";

export type SynthesizeResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `You are a meeting notes assistant. Given a raw meeting transcript, produce a clear, scannable summary in markdown.

Include:
1. **Summary** – 2–3 sentence overview.
2. **Key points** – Bullet list of main discussion points.
3. **Decisions** – Any decisions made.
4. **Action items** – One bullet per task. When someone is assigned, use "**Name:** task" or "Name: task" so we can assign tasks to the right person (e.g. "- **Sam:** Follow up with client" or "- Jonah to review the doc"). If no owner is clear, use "Team" or just the task.
5. **Next steps** – If mentioned.

Keep the tone professional and concise. Use markdown headings (##) and bullets. Do not invent content that is not in the transcript.`;

/** Synthesize transcript content into a structured summary using Kimi. */
export async function synthesizeTranscriptWithKimi(
  title: string,
  rawContent: string
): Promise<SynthesizeResult> {
  const apiKey = getKimiApiKeyOptional();
  if (!apiKey) {
    return { ok: false, error: kimiKeyMissingMessage() };
  }

  const userContent = `Meeting: ${title}\n\nRaw transcript:\n\n${rawContent.slice(0, 30000)}`;

  try {
    const res = await fetch(`${KIMI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Kimi API: ${res.status} ${err.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (data.error?.message) return { ok: false, error: data.error.message };
    if (!content) return { ok: false, error: "Empty response from Kimi." };

    return { ok: true, content };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Kimi request failed.";
    return { ok: false, error: message };
  }
}

const EXTRACT_MEETINGS_SYSTEM = `You extract meeting identifiers from raw API output. The output may be XML, JSON, or plain text.

Return ONLY a JSON array of objects with exactly two keys: "id" and "title".
- "id": the meeting's unique id (UUID or string id from the source).
- "title": the meeting name/title.

Example: [{"id": "b7792165-5399-4bdc-85a2-623995c56bef", "title": "Finest Known x Goji Handoff"}, ...]

No markdown, no code fences, no explanation. Only the JSON array.`;

export type ExtractedMeeting = { id: string; title: string };

export type ExtractMeetingsResult =
  | { ok: true; meetings: ExtractedMeeting[] }
  | { ok: false; error: string };

/** Use Kimi to extract meeting id and title from raw list response (XML, JSON, or text). */
export async function extractMeetingsFromRawText(rawText: string): Promise<ExtractMeetingsResult> {
  const apiKey = getKimiApiKeyOptional();
  if (!apiKey) {
    return { ok: false, error: kimiKeyMissingMessage() };
  }

  const truncated = rawText.slice(0, 50000);
  const userContent = `Extract every meeting's id and title from this raw output:\n\n${truncated}`;

  try {
    const res = await fetch(`${KIMI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: EXTRACT_MEETINGS_SYSTEM },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Kimi API: ${res.status} ${err.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (data.error?.message) return { ok: false, error: data.error.message };
    if (!content) return { ok: false, error: "Empty response from Kimi." };

    const jsonStr = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as unknown;
    if (!Array.isArray(parsed)) return { ok: false, error: "Kimi did not return a JSON array." };
    const meetings: ExtractedMeeting[] = [];
    for (const item of parsed) {
      if (item && typeof item === "object" && "id" in item && "title" in item) {
        const id = String((item as { id: unknown }).id ?? "").trim();
        const title = String((item as { title: unknown }).title ?? "").trim();
        if (id) meetings.push({ id, title: title || id });
      }
    }
    return { ok: true, meetings };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Kimi request failed.";
    return { ok: false, error: message };
  }
}

const ASK_DATA_SYSTEM = `You are a helpful assistant. You will be given a block of data (e.g. meeting transcript or list) and the user's question. Answer based only on the provided data. Be concise. Do not invent or assume information that is not in the data. If the data does not contain enough to answer, say so.`;

/** Send a user message to Kimi with context data; returns Kimi's reply. */
export async function askKimiAboutData(
  contextTitle: string,
  contextContent: string,
  userMessage: string
): Promise<SynthesizeResult> {
  const apiKey = getKimiApiKeyOptional();
  if (!apiKey) {
    return { ok: false, error: kimiKeyMissingMessage() };
  }

  const truncated = contextContent.slice(0, 40000);
  const userContent = `Data: ${contextTitle}\n\n${truncated}\n\n---\n\nUser question: ${userMessage.trim()}`;

  try {
    const res = await fetch(`${KIMI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: ASK_DATA_SYSTEM },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Kimi API: ${res.status} ${err.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (data.error?.message) return { ok: false, error: data.error.message };
    if (!content) return { ok: false, error: "Empty response from Kimi." };

    return { ok: true, content };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Kimi request failed.";
    return { ok: false, error: message };
  }
}
