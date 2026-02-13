"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProjectId, isUuid } from "@/lib/validators";
import {
  buildGoogleCalendarAuthUrl,
  storeGoogleCalendarPending,
  getGoogleCalendarAccessTokenForUser,
} from "@/lib/google-calendar-oauth";
import { randomBytes } from "crypto";

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type EventResult = { ok: true; id: string } | { ok: false; error: string };
export type VoidResult = { ok: true } | { ok: false; error: string };

export async function createCalendarEvent(
  projectId: string,
  data: { title: string; start_at: string; end_at: string; link?: string | null }
): Promise<EventResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("calendar_events")
    .insert({
      project_id: projectId,
      source: "manual",
      title: data.title.trim(),
      start_at: data.start_at,
      end_at: data.end_at,
      link: data.link?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Failed to create event." };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true, id: row.id };
}

export async function deleteCalendarEvent(projectId: string, eventId: string): Promise<VoidResult> {
  if (!isValidProjectId(projectId) || !isUuid(eventId)) return { ok: false, error: "Invalid project or event." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true };
}

export type GoogleCalendarConnectUrlResult = { ok: true; url: string } | { ok: false; error: string };
export type GoogleCalendarConnectedResult = { ok: true; connected: boolean } | { ok: false; error: string };
export type CreateGoogleMeetingResult =
  | { ok: true; eventLink: string; eventId: string; localId: string }
  | { ok: false; error: string };

/** Get the URL to send the user to for "Connect Google Calendar". Optional returnPath e.g. /projects/xxx/settings#calendar. */
export async function getGoogleCalendarConnectUrl(returnPath?: string): Promise<GoogleCalendarConnectUrlResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const state = base64UrlEncode(randomBytes(16));
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const url = await buildGoogleCalendarAuthUrl({ state, codeVerifier, returnPath });
  if (!url) return { ok: false, error: "Google Calendar OAuth not configured. Set GOOGLE_CALENDAR_CLIENT_ID (and CLIENT_SECRET) in env." };
  await storeGoogleCalendarPending(state, codeVerifier, user.id, returnPath);
  return { ok: true, url };
}

/** Check if the current user has connected Google Calendar. */
export async function getGoogleCalendarConnected(): Promise<GoogleCalendarConnectedResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const token = await getGoogleCalendarAccessTokenForUser(user.id);
  return { ok: true, connected: !!token };
}

/** Create a meeting in the user's Google Calendar and optionally add to project calendar_events. */
export async function createGoogleCalendarMeeting(
  projectId: string,
  data: {
    title: string;
    description?: string | null;
    start_at: string;
    end_at: string;
    attendees?: string[];
  }
): Promise<CreateGoogleMeetingResult> {
  if (!isValidProjectId(projectId)) return { ok: false, error: "Invalid project." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const accessToken = await getGoogleCalendarAccessTokenForUser(user.id);
  if (!accessToken) return { ok: false, error: "Google Calendar not connected. Connect in Settings → Calendar." };

  const start = new Date(data.start_at);
  const end = new Date(data.end_at);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  const body = {
    summary: data.title.trim(),
    description: data.description?.trim() || undefined,
    start: { dateTime: start.toISOString(), timeZone },
    end: { dateTime: end.toISOString(), timeZone },
    attendees: (data.attendees ?? [])
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .map((email) => ({ email })),
  };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: `Google Calendar: ${res.status} ${err.slice(0, 200)}` };
  }

  const event = (await res.json()) as { id: string; htmlLink?: string };
  const eventLink = event.htmlLink ?? `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(event.id)}`;

  const supabase = await createClient();
  const { data: row, error: insertError } = await supabase
    .from("calendar_events")
    .insert({
      project_id: projectId,
      source: "google",
      external_id: event.id,
      title: data.title.trim(),
      start_at: data.start_at,
      end_at: data.end_at,
      link: eventLink,
    })
    .select("id")
    .single();
  if (insertError || !row) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/settings`);
    return { ok: true, eventLink, eventId: event.id, localId: "" };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true, eventLink, eventId: event.id, localId: row.id };
}
