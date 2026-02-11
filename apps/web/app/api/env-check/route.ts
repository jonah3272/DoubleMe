import { NextResponse } from "next/server";

/**
 * GET /api/env-check — Verify Supabase env vars are present in this deployment.
 * Returns only prefix/suffix of key so you can confirm without exposing it.
 * Remove or restrict this route in production if you prefer.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const hasUrl = Boolean(url?.trim());
  const hasKey = Boolean(key?.trim());
  const keyPrefix = key?.trim().slice(0, 20) ?? "(missing)";
  const keySuffix = key?.trim().length ? key.trim().slice(-4) : "(missing)";
  const keyLength = key?.trim().length ?? 0;

  return NextResponse.json({
    hasUrl,
    hasKey,
    keyPrefix,
    keySuffix,
    keyLength,
    urlPrefix: url?.trim().slice(0, 30) ?? "(missing)",
    message: hasUrl && hasKey
      ? "Env vars are set. If you still see Invalid API key, the key may be wrong for this project or the legacy anon JWT may be required."
      : "Missing one or both of NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them in Vercel and redeploy.",
  });
}
