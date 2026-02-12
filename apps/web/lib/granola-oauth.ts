/**
 * Granola OAuth 2.0 flow for "Connect your Granola account" (like Claude/ChatGPT).
 * Uses metadata from https://mcp.granola.ai/.well-known/oauth-authorization-server
 * and Dynamic Client Registration (DCR) when client_id is not set.
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAppOriginOptional } from "@/lib/env";
import { randomBytes, createHash } from "crypto";

const OAUTH_METADATA_URL = "https://mcp.granola.ai/.well-known/oauth-authorization-server";

type OAuthMetadata = {
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint: string;
  scopes_supported?: string[];
};

let cachedMetadata: OAuthMetadata | null = null;

async function getMetadata(): Promise<OAuthMetadata> {
  if (cachedMetadata) return cachedMetadata;
  const res = await fetch(OAUTH_METADATA_URL);
  if (!res.ok) throw new Error("Failed to fetch Granola OAuth metadata");
  cachedMetadata = (await res.json()) as OAuthMetadata;
  return cachedMetadata!;
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

function computeCodeChallenge(verifier: string): string {
  return base64UrlEncode(createHash("sha256").update(verifier, "utf8").digest());
}

/** Get or create OAuth client via DCR. Returns { client_id, client_secret }. Re-registers if redirect_uri changed (e.g. after fixing app URL). */
async function getOrRegisterClient(redirectUri: string): Promise<{ client_id: string; client_secret: string | null }> {
  const supabase = createServiceRoleClient();
  const { data: row } = await supabase.from("granola_oauth_client").select("client_id, client_secret, redirect_uri").single();
  if (row?.client_id && row.redirect_uri === redirectUri) return { client_id: row.client_id, client_secret: row.client_secret ?? null };
  if (row?.client_id) await supabase.from("granola_oauth_client").update({ client_id: null, client_secret: null, redirect_uri: null, updated_at: new Date().toISOString() }).eq("id", 1);

  const meta = await getMetadata();
  const regRes = await fetch(meta.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      redirect_uris: [redirectUri],
      client_name: "DoubleMe",
      scope: "openid profile email offline_access",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      code_challenge_method: "S256",
      application_type: "web",
    }),
  });
  if (!regRes.ok) {
    const err = await regRes.text();
    throw new Error(`Granola OAuth registration failed: ${regRes.status} ${err}`);
  }
  const reg = (await regRes.json()) as { client_id: string; client_secret?: string };
  await supabase.from("granola_oauth_client").upsert(
    { id: 1, client_id: reg.client_id, client_secret: reg.client_secret ?? null, redirect_uri: redirectUri, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  return { client_id: reg.client_id, client_secret: reg.client_secret ?? null };
}

/** Build the URL to send the user to for Granola sign-in. Caller must store state -> code_verifier in granola_oauth_pending. */
export async function buildGranolaAuthorizeUrl(params: {
  redirectUri: string;
  state: string;
  codeVerifier: string;
}): Promise<string> {
  const { redirectUri, state, codeVerifier } = params;
  const meta = await getMetadata();
  const { client_id } = await getOrRegisterClient(redirectUri);
  const codeChallenge = computeCodeChallenge(codeVerifier);
  const scope = (meta.scopes_supported ?? ["openid", "profile", "email", "offline_access"]).join(" ");
  const url = new URL(meta.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", client_id);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

/** Exchange authorization code for tokens and return access_token, refresh_token, expires_in. */
export async function exchangeGranolaCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const { code, codeVerifier, redirectUri } = params;
  const meta = await getMetadata();
  const supabase = createServiceRoleClient();
  const { data: row } = await supabase.from("granola_oauth_client").select("client_id, client_secret").single();
  if (!row?.client_id) throw new Error("Granola OAuth client not registered");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_id: row.client_id,
  });
  if (row.client_secret) body.set("client_secret", row.client_secret);

  const res = await fetch(meta.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Granola token exchange failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in };
}

/** Store pending OAuth state (state -> code_verifier, user_id). */
export async function storeGranolaPending(state: string, codeVerifier: string, userId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from("granola_oauth_pending").insert({ state, code_verifier: codeVerifier, user_id: userId });
}

/** Get and delete pending row by state. Returns { code_verifier, user_id } or null. */
export async function consumeGranolaPending(state: string): Promise<{ code_verifier: string; user_id: string } | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("granola_oauth_pending").select("code_verifier, user_id").eq("state", state).single();
  if (error || !data) return null;
  await supabase.from("granola_oauth_pending").delete().eq("state", state);
  return { code_verifier: data.code_verifier, user_id: data.user_id };
}

/** Save tokens for user. */
export async function saveGranolaTokens(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number | null
): Promise<void> {
  const supabase = createServiceRoleClient();
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
  await supabase.from("granola_tokens").upsert(
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

/** Get access token for user (for MCP calls). Returns null if not connected. */
export async function getGranolaAccessTokenForUser(userId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("granola_tokens").select("access_token, expires_at").eq("user_id", userId).single();
  if (!data?.access_token) return null;
  if (data.expires_at && new Date(data.expires_at) <= new Date()) {
    // TODO: refresh using refresh_token if we have it
    return null;
  }
  return data.access_token;
}

/** Reset Granola OAuth so the next "Connect to Granola" runs as if first time: clear stored client (forces new DCR) and this user's token. */
export async function resetGranolaConnection(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from("granola_oauth_client").update({
    client_id: null,
    client_secret: null,
    redirect_uri: null,
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  await supabase.from("granola_tokens").delete().eq("user_id", userId);
}
