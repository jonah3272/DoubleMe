"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Dialog, EmptyState, useToast } from "@/components/ui";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getGoogleCalendarConnectUrl,
  createGoogleCalendarMeeting,
} from "./calendar-actions";

export type CalendarEventRow = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  link: string | null;
};

export function CalendarSection({
  projectId,
  initialEvents,
  googleCalendarConnected = false,
}: {
  projectId: string;
  initialEvents: CalendarEventRow[];
  googleCalendarConnected?: boolean;
}) {
  const [events, setEvents] = useState<CalendarEventRow[]>(initialEvents);
  const [addOpen, setAddOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", start_at: "", end_at: "", link: "" });
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    agenda: "",
    participants: "",
    start_at: "",
    end_at: "",
  });
  const { addToast } = useToast();
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_at || !form.end_at) return;
    setSubmitting(true);
    const result = await createCalendarEvent(projectId, {
      title: form.title.trim(),
      start_at: form.start_at,
      end_at: form.end_at,
      link: form.link.trim() || null,
    });
    setSubmitting(false);
    if (result.ok) {
      setAddOpen(false);
      setForm({ title: "", start_at: "", end_at: "", link: "" });
      router.refresh();
      addToast("Event added.", "success");
      setEvents((prev) => [...prev, { id: result.id, title: form.title.trim(), start_at: form.start_at, end_at: form.end_at, link: form.link.trim() || null }]);
    } else {
      addToast(result.error, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    const result = await deleteCalendarEvent(projectId, deleteId);
    setSubmitting(false);
    if (result.ok) {
      setDeleteId(null);
      router.refresh();
      addToast("Event removed.", "success");
      setEvents((prev) => prev.filter((e) => e.id !== deleteId));
    } else {
      addToast(result.error, "error");
    }
  };

  const handleConnectGoogleCalendar = async () => {
    const result = await getGoogleCalendarConnectUrl(`/projects/${projectId}/settings#calendar`);
    if (result.ok) window.location.href = result.url;
    else addToast(result.error, "error");
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title.trim() || !meetingForm.start_at || !meetingForm.end_at) return;
    setSubmitting(true);
    const attendees = meetingForm.participants
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const result = await createGoogleCalendarMeeting(projectId, {
      title: meetingForm.title.trim(),
      description: meetingForm.agenda.trim() || null,
      start_at: meetingForm.start_at,
      end_at: meetingForm.end_at,
      attendees: attendees.length > 0 ? attendees : undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      setMeetingOpen(false);
      setMeetingForm({ title: "", agenda: "", participants: "", start_at: "", end_at: "" });
      router.refresh();
      addToast("Meeting created in Google Calendar.", "success");
      if (result.localId) {
        setEvents((prev) => [
          ...prev,
          {
            id: result.localId,
            title: meetingForm.title.trim(),
            start_at: meetingForm.start_at,
            end_at: meetingForm.end_at,
            link: result.eventLink,
          },
        ]);
      }
      if (result.eventLink) window.open(result.eventLink, "_blank");
    } else {
      addToast(result.error, "error");
    }
  };

  const formatWhen = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const sameDay = s.toDateString() === e.toDateString();
    if (sameDay) return `${s.toLocaleDateString()} ${s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    return `${s.toLocaleString()} – ${e.toLocaleString()}`;
  };

  return (
    <div id="calendar" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>Calendar</h3>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {googleCalendarConnected && (
            <Button variant="primary" onClick={() => setMeetingOpen(true)}>
              Create meeting (Google)
            </Button>
          )}
          {!googleCalendarConnected && (
            <Button variant="secondary" onClick={handleConnectGoogleCalendar}>
              Connect Google Calendar
            </Button>
          )}
          <Button onClick={() => setAddOpen(true)}>Add event</Button>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
        {googleCalendarConnected
          ? "Create meetings in your Google Calendar (with agenda and participants) or add local events below."
          : "Connect Google Calendar to create meetings with agenda and participants. Or add events manually — they show on the project overview."}
      </p>
      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events here or connect a calendar in the future."
          action={<Button onClick={() => setAddOpen(true)}>Add event</Button>}
        />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {events
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
            .map((ev) => (
              <li
                key={ev.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div>
                  <span style={{ fontWeight: "var(--font-medium)" }}>{ev.title}</span>
                  <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    {formatWhen(ev.start_at, ev.end_at)}
                  </span>
                </div>
                <Button variant="secondary" onClick={() => setDeleteId(ev.id)} disabled={submitting} style={{ color: "var(--color-error, #b91c1c)" }}>
                  Remove
                </Button>
              </li>
            ))}
        </ul>
      )}

      <Dialog open={meetingOpen} onClose={() => !submitting && setMeetingOpen(false)} title="Create meeting in Google Calendar">
        <form onSubmit={handleCreateMeeting} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Title *</label>
          <Input
            value={meetingForm.title}
            onChange={(e) => setMeetingForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Meeting title"
            required
          />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Agenda (optional)</label>
          <textarea
            value={meetingForm.agenda}
            onChange={(e) => setMeetingForm((f) => ({ ...f, agenda: e.target.value }))}
            placeholder="What will you cover?"
            rows={3}
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Participants (optional)</label>
          <textarea
            value={meetingForm.participants}
            onChange={(e) => setMeetingForm((f) => ({ ...f, participants: e.target.value }))}
            placeholder="Comma- or newline-separated emails"
            rows={2}
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Start *</label>
          <Input
            type="datetime-local"
            value={meetingForm.start_at}
            onChange={(e) => setMeetingForm((f) => ({ ...f, start_at: e.target.value }))}
            required
          />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>End *</label>
          <Input
            type="datetime-local"
            value={meetingForm.end_at}
            onChange={(e) => setMeetingForm((f) => ({ ...f, end_at: e.target.value }))}
            required
          />
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <Button type="button" variant="secondary" onClick={() => setMeetingOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !meetingForm.title.trim() || !meetingForm.start_at || !meetingForm.end_at}>
              {submitting ? "Creating…" : "Create meeting"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={addOpen} onClose={() => !submitting && setAddOpen(false)} title="Add event">
        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Title *</label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event title" required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Start *</label>
          <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>End *</label>
          <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Link (optional)</label>
          <Input type="url" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://…" />
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.title.trim() || !form.start_at || !form.end_at}>
              {submitting ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={deleteId !== null} onClose={() => !submitting && setDeleteId(null)} title="Remove event">
        <p style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Remove &quot;{events.find((e) => e.id === deleteId)?.title ?? "this event"}&quot;?
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={() => setDeleteId(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={submitting} style={{ backgroundColor: "var(--color-error, #b91c1c)" }}>
            {submitting ? "Removing…" : "Remove"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
