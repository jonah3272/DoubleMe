/**
 * Env validation. Throws at runtime if required vars are missing.
 * Use in code paths that need these values (e.g. when creating Supabase clients).
 */

function getEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvOptional(name: string): string | undefined {
  return process.env[name];
}

/** Required for Supabase browser and server (session) usage. */
export function getSupabaseUrl(): string {
  return getEnv("NEXT_PUBLIC_SUPABASE_URL");
}

/** Anon key; safe for browser. Required. */
export function getSupabaseAnonKey(): string {
  return getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** Supabase URL if set (does not throw). Use when env may be missing (e.g. server render). */
export function getSupabaseUrlOptional(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
}

/** Anon key if set (does not throw). Use when env may be missing. */
export function getSupabaseAnonKeyOptional(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;
}

/** Service role key; server-only, never expose to client. Optional. */
export function getSupabaseServiceRoleKey(): string | undefined {
  return getEnvOptional("SUPABASE_SERVICE_ROLE_KEY");
}

/** Service role key; throws if not set. Use only when you explicitly need to bypass RLS. */
export function getSupabaseServiceRoleKeyOrThrow(): string {
  const key = getSupabaseServiceRoleKey();
  if (!key) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}

const DEFAULT_GRANOLA_MCP_URL = "https://mcp.granola.ai/mcp";

/** Granola MCP server URL. Defaults to https://mcp.granola.ai/mcp if not set. */
export function getGranolaMcpUrlOptional(): string | undefined {
  return process.env.GRANOLA_MCP_URL?.trim() || DEFAULT_GRANOLA_MCP_URL;
}

/** Granola API token for MCP auth. Optional. */
export function getGranolaApiTokenOptional(): string | undefined {
  return process.env.GRANOLA_API_TOKEN?.trim() || undefined;
}

/** App origin for OAuth redirect_uri (e.g. https://app.example.com). Optional. Always returns scheme + host only, no path. */
export function getAppOriginOptional(): string | undefined {
  let url = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "").trim();
  if (!url) return undefined;
  // Fix common typo: "https//" -> "https://"
  if (url.startsWith("https//")) url = "https://" + url.slice(7);
  else if (url.startsWith("http//")) url = "http://" + url.slice(6);
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
  try {
    const parsed = new URL(url);
    // Origin = scheme + host only (no path, so we never double-append /api/auth/granola/callback)
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
}
