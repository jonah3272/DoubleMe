/**
 * Kimi (Moonshot) API – OpenAI-compatible chat completion.
 * Used to synthesize meeting transcripts into readable summaries.
 * Set KIMI_API_KEY in .env or .env.local (get key from https://platform.moonshot.ai).
 */

import { getKimiApiKeyOptional } from "@/lib/env";

const KIMI_API_BASE = "https://api.moonshot.ai/v1";
const MODEL = "kimi-k2-turbo-preview";

export type SynthesizeResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `You are a meeting notes assistant. Given a raw meeting transcript, produce a clear, scannable summary in markdown.

Include:
1. **Summary** – 2–3 sentence overview.
2. **Key points** – Bullet list of main discussion points.
3. **Decisions** – Any decisions made.
4. **Action items** – Clear to-dos with owners if mentioned (otherwise "Someone" or "Team").
5. **Next steps** – If mentioned.

Keep the tone professional and concise. Use markdown headings (##) and bullets. Do not invent content that is not in the transcript.`;

/** Synthesize transcript content into a structured summary using Kimi. */
export async function synthesizeTranscriptWithKimi(
  title: string,
  rawContent: string
): Promise<SynthesizeResult> {
  const apiKey = getKimiApiKeyOptional();
  if (!apiKey) {
    return { ok: false, error: "KIMI_API_KEY is not set. Add it to .env (or .env.local) to use synthesis." };
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
