import { NextRequest, NextResponse } from "next/server";
import {
  consumeGoogleCalendarPending,
  exchangeGoogleCalendarCode,
  saveGoogleCalendarTokens,
} from "@/lib/google-calendar-oauth";
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
    return NextResponse.redirect(`${baseRedirect}?google_calendar_error=${encodeURIComponent(errorDesc)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseRedirect}?google_calendar_error=${encodeURIComponent("Missing code or state")}`);
  }

  try {
    const pending = await consumeGoogleCalendarPending(state);
    if (!pending) {
      return NextResponse.redirect(`${baseRedirect}?google_calendar_error=${encodeURIComponent("Invalid or expired state")}`);
    }

    const redirectUri = origin ? `${origin}/api/auth/google-calendar/callback` : "";
    if (!redirectUri) {
      return NextResponse.redirect(`${baseRedirect}?google_calendar_error=${encodeURIComponent("App URL not configured")}`);
    }

    const tokens = await exchangeGoogleCalendarCode({
      code,
      codeVerifier: pending.code_verifier,
      redirectUri,
    });

    await saveGoogleCalendarTokens(
      pending.user_id,
      tokens.access_token,
      tokens.refresh_token ?? null,
      tokens.expires_in ?? null
    );

    const returnPath = pending.return_path?.trim();
    const redirect = returnPath && returnPath.startsWith("/") ? `${origin}${returnPath}` : `${baseRedirect}?google_calendar=connected`;
    return NextResponse.redirect(redirect);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Google Calendar OAuth failed";
    return NextResponse.redirect(`${baseRedirect}?google_calendar_error=${encodeURIComponent(message)}`);
  }
}
