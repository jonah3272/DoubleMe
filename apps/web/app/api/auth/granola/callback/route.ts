import { NextRequest, NextResponse } from "next/server";
import {
  consumeGranolaPending,
  exchangeGranolaCode,
  saveGranolaTokens,
} from "@/lib/granola-oauth";
import { getAppOriginOptional } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = getAppOriginOptional();
  const baseRedirect = origin ? `${origin}/projects` : "/projects";

  if (error) {
    const errorDesc = searchParams.get("error_description") || error;
    return NextResponse.redirect(`${baseRedirect}?granola_error=${encodeURIComponent(errorDesc)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseRedirect}?granola_error=${encodeURIComponent("Missing code or state")}`);
  }

  try {
    const pending = await consumeGranolaPending(state);
    if (!pending) {
      return NextResponse.redirect(`${baseRedirect}?granola_error=${encodeURIComponent("Invalid or expired state")}`);
    }

    const redirectUri = origin ? `${origin}/api/auth/granola/callback` : "";
    if (!redirectUri) {
      return NextResponse.redirect(`${baseRedirect}?granola_error=${encodeURIComponent("App URL not configured")}`);
    }

    const tokens = await exchangeGranolaCode({
      code,
      codeVerifier: pending.code_verifier,
      redirectUri,
    });

    await saveGranolaTokens(
      pending.user_id,
      tokens.access_token,
      tokens.refresh_token ?? null,
      tokens.expires_in ?? null
    );

    return NextResponse.redirect(`${baseRedirect}?granola=connected`);
  } catch (e) {
    const message = e instanceof Error ? e.message : "OAuth failed";
    return NextResponse.redirect(`${baseRedirect}?granola_error=${encodeURIComponent(message)}`);
  }
}
