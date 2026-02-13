/**
 * Google OAuth 2.0 for Calendar API (create events in user's Google Calendar).
 * Uses PKCE. Env: GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET.
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAppOriginOptional } from "@/lib/env";
import { randomBytes, createHash } from "crypto";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

function computeCodeChallenge(verifier: string): string {
  return base64UrlEncode(createHash("sha256").update(verifier, "utf8").digest());
}

function getClientConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  if (!clientId) return null;
  return { clientId, clientSecret: clientSecret ?? "" };
}

/** Build the URL to send the user to for Google sign-in. Caller must store state in google_oauth_pending. */
export async function buildGoogleCalendarAuthUrl(params: {
  state: string;
  codeVerifier: string;
  returnPath?: string;
}): Promise<string | null> {
  const config = getClientConfig();
  if (!config) return null;
  const origin = getAppOriginOptional();
  if (!origin) return null;
  const redirectUri = `${origin}/api/auth/google-calendar/callback`;
  const codeChallenge = computeCodeChallenge(params.codeVerifier);
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

/** Store pending OAuth state. */
export async function storeGoogleCalendarPending(
  state: string,
  codeVerifier: string,
  userId: string,
  returnPath?: string
): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from("google_oauth_pending").insert({
    state,
    code_verifier: codeVerifier,
    user_id: userId,
    return_path: returnPath ?? null,
  });
}

/** Get and delete pending row by state. */
export async function consumeGoogleCalendarPending(
  state: string
): Promise<{ code_verifier: string; user_id: string; return_path: string | null } | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("google_oauth_pending")
    .select("code_verifier, user_id, return_path")
    .eq("state", state)
    .single();
  if (error || !data) return null;
  await supabase.from("google_oauth_pending").delete().eq("state", state);
  return {
    code_verifier: data.code_verifier,
    user_id: data.user_id,
    return_path: data.return_path ?? null,
  };
}

/** Exchange authorization code for tokens. */
export async function exchangeGoogleCalendarCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const config = getClientConfig();
  if (!config) throw new Error("Google Calendar OAuth not configured");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
    client_id: config.clientId,
  });
  if (config.clientSecret) body.set("client_secret", config.clientSecret);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

/** Save tokens for user. */
export async function saveGoogleCalendarTokens(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number | null
): Promise<void> {
  const supabase = createServiceRoleClient();
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
  await supabase.from("google_calendar_tokens").upsert(
    {
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

/** Get access token for user; refresh if expired. Returns null if not connected or config missing. */
export async function getGoogleCalendarAccessTokenForUser(userId: string): Promise<string | null> {
  const config = getClientConfig();
  if (!config) return null;
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("google_calendar_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();
  if (!data?.access_token) return null;
  const now = new Date();
  const expired = data.expires_at && new Date(data.expires_at) <= now;
  if (!expired) return data.access_token;
  if (!data.refresh_token) return null;
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: data.refresh_token,
      client_id: config.clientId,
    });
    if (config.clientSecret) body.set("client_secret", config.clientSecret);
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return null;
    const tokens = (await res.json()) as { access_token: string; expires_in?: number };
    await saveGoogleCalendarTokens(
      userId,
      tokens.access_token,
      data.refresh_token,
      tokens.expires_in ?? null
    );
    return tokens.access_token;
  } catch {
    return null;
  }
}
