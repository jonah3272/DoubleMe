"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Dialog,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  useToast,
} from "@/components/ui";
import { createTask, updateTask, deleteTask, createTasksFromLines, type TaskStatus } from "./actions";
import {
  getGranolaMcpToolsAction,
  listGranolaDocumentsAction,
  importTasksFromGranolaDocument,
  type GranolaDocument,
} from "./granola-actions";

export type TaskRow = {
  id: string;
  title: string;
  status: string;
  assignee_id: string | null;
  assignee_name: string | null;
  due_at: string | null;
  notes: string | null;
};

export type ContactOption = { id: string; name: string };

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

export function TasksClient({
  projectId,
  initialTasks,
  contacts,
}: {
  projectId: string;
  initialTasks: TaskRow[];
  contacts: ContactOption[];
}) {
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [addOpen, setAddOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingPaste, setMeetingPaste] = useState("");
  const [meetingDue, setMeetingDue] = useState<"today" | "week">("week");
  const [granolaOpen, setGranolaOpen] = useState(false);
  const [granolaDocs, setGranolaDocs] = useState<GranolaDocument[]>([]);
  const [granolaListError, setGranolaListError] = useState<string | null>(null);
  const [granolaLoadingTools, setGranolaLoadingTools] = useState(false);
  const [granolaLoadingList, setGranolaLoadingList] = useState(false);
  const [granolaToolsError, setGranolaToolsError] = useState<string | null>(null);
  const [granolaListTools, setGranolaListTools] = useState<string[]>([]);
  const [granolaSelectedListTool, setGranolaSelectedListTool] = useState("");
  const [granolaSearchQuery, setGranolaSearchQuery] = useState("");
  const [granolaListFetched, setGranolaListFetched] = useState(false);
  const [granolaSelectedId, setGranolaSelectedId] = useState("");
  const [granolaDue, setGranolaDue] = useState<"today" | "week">("week");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    status: "todo" as TaskStatus,
    assignee_id: "",
    due_at: "",
    notes: "",
  });
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const openEdit = (t: TaskRow) => {
    setEditing(t);
    setForm({
      title: t.title,
      status: (t.status as TaskStatus) || "todo",
      assignee_id: t.assignee_id ?? "",
      due_at: t.due_at ? t.due_at.slice(0, 16) : "",
      notes: t.notes ?? "",
    });
    setEditOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    const result = await createTask(projectId, {
      title: form.title.trim(),
      status: form.status,
      assignee_id: form.assignee_id || null,
      due_at: form.due_at || null,
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);
    if (result.ok) {
      setAddOpen(false);
      setForm({ title: "", status: "todo", assignee_id: "", due_at: "", notes: "" });
      router.refresh();
      addToast("Task added.", "success");
      const assignee = contacts.find((c) => c.id === form.assignee_id);
      setTasks((prev) => [
        ...prev,
        {
          id: result.id,
          title: form.title.trim(),
          status: form.status,
          assignee_id: form.assignee_id || null,
          assignee_name: assignee?.name ?? null,
          due_at: form.due_at || null,
          notes: form.notes.trim() || null,
        },
      ]);
    } else {
      addToast(result.error, "error");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !form.title.trim()) return;
    setSubmitting(true);
    const result = await updateTask(projectId, editing.id, {
      title: form.title.trim(),
      status: form.status,
      assignee_id: form.assignee_id || null,
      due_at: form.due_at || null,
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);
    if (result.ok) {
      setEditOpen(false);
      setEditing(null);
      router.refresh();
      addToast("Task updated.", "success");
      const assignee = contacts.find((c) => c.id === form.assignee_id);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                title: form.title.trim(),
                status: form.status,
                assignee_id: form.assignee_id || null,
                assignee_name: assignee?.name ?? null,
                due_at: form.due_at || null,
                notes: form.notes.trim() || null,
              }
            : t
        )
      );
    } else {
      addToast(result.error, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    const result = await deleteTask(projectId, deleteId);
    setSubmitting(false);
    if (result.ok) {
      setDeleteId(null);
      router.refresh();
      addToast("Task deleted.", "success");
      setTasks((prev) => prev.filter((t) => t.id !== deleteId));
    } else {
      addToast(result.error, "error");
    }
  };

  const formatDue = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek);
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday, 23, 59, 59).toISOString();

  const dailyTasks = tasks.filter(
    (t) =>
      (t.status === "todo" || t.status === "in_progress") &&
      t.due_at &&
      t.due_at >= startOfToday &&
      t.due_at <= endOfWeek
  );
  const otherTasks = tasks.filter((t) => !dailyTasks.includes(t));

  const handleToggleDone = async (t: TaskRow) => {
    const nextStatus = t.status === "done" ? "todo" : "done";
    setTogglingId(t.id);
    const result = await updateTask(projectId, t.id, { status: nextStatus });
    setTogglingId(null);
    if (result.ok) {
      setTasks((prev) => prev.map((task) => (task.id === t.id ? { ...task, status: nextStatus } : task)));
      router.refresh();
    } else {
      addToast(result.error, "error");
    }
  };

  const meetingLines = meetingPaste
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const handleAddFromMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingLines.length === 0) return;
    setSubmitting(true);
    const dueAt = meetingDue === "today" ? endOfToday : endOfWeek;
    const result = await createTasksFromLines(
      projectId,
      meetingLines.map((title) => ({ title, due_at: dueAt }))
    );
    setSubmitting(false);
    if (result.ok) {
      setMeetingOpen(false);
      setMeetingPaste("");
      router.refresh();
      addToast(`${result.count} task${result.count === 1 ? "" : "s"} added from meeting.`, "success");
    } else {
      addToast(result.error, "error");
    }
  };

  const handleOpenGranola = async () => {
    setGranolaOpen(true);
    setGranolaDocs([]);
    setGranolaListError(null);
    setGranolaSelectedId("");
    setGranolaListFetched(false);
    setGranolaToolsError(null);
    setGranolaLoadingTools(true);
    const toolsResult = await getGranolaMcpToolsAction();
    setGranolaLoadingTools(false);
    if (toolsResult.ok) {
      setGranolaListTools(toolsResult.listTools);
      setGranolaSelectedListTool(toolsResult.defaultListTool ?? toolsResult.listTools[0] ?? "");
    } else {
      setGranolaToolsError(toolsResult.error);
      setGranolaListTools([]);
      setGranolaSelectedListTool("");
      addToast(toolsResult.error, "error");
    }
  };

  const handleLoadGranolaMeetings = async () => {
    if (!granolaSelectedListTool) return;
    setGranolaListError(null);
    setGranolaLoadingList(true);
    const result = await listGranolaDocumentsAction(
      granolaSelectedListTool,
      granolaSelectedListTool === "search_meetings" ? granolaSearchQuery : undefined
    );
    setGranolaLoadingList(false);
    setGranolaListFetched(true);
    if (result.ok) setGranolaDocs(result.documents);
    else {
      setGranolaListError(result.error);
      addToast(result.error, "error");
    }
  };

  const handleImportFromGranola = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!granolaSelectedId) return;
    setSubmitting(true);
    const result = await importTasksFromGranolaDocument(projectId, granolaSelectedId, granolaDue);
    setSubmitting(false);
    if (result.ok) {
      setGranolaOpen(false);
      setGranolaSelectedId("");
      router.refresh();
      addToast(`${result.count} task${result.count === 1 ? "" : "s"} imported from Granola.`, "success");
    } else {
      addToast(result.error, "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <Link href={`/projects/${projectId}`} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}>
          ← Overview
        </Link>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button variant="secondary" onClick={handleOpenGranola}>
            Import from Granola
          </Button>
          <Button variant="secondary" onClick={() => setMeetingOpen(true)}>
            Add from meeting
          </Button>
          <Button onClick={() => setAddOpen(true)}>Add task</Button>
        </div>
      </div>

      {/* Daily tasks – this week, cross off */}
      <section>
        <h2 style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
          This week
        </h2>
        {dailyTasks.length === 0 ? (
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            No tasks due this week. Add tasks or paste from meeting notes above.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {dailyTasks.map((t) => (
              <li
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-2) 0",
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <button
                  type="button"
                  aria-label={t.status === "done" ? "Mark not done" : "Mark done"}
                  onClick={() => handleToggleDone(t)}
                  disabled={togglingId === t.id}
                  style={{
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    borderRadius: "var(--radius-sm)",
                    border: "2px solid var(--color-border)",
                    backgroundColor: t.status === "done" ? "var(--color-primary)" : "transparent",
                    cursor: togglingId === t.id ? "wait" : "pointer",
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: "var(--text-base)",
                    textDecoration: t.status === "done" ? "line-through" : "none",
                    color: t.status === "done" ? "var(--color-text-muted)" : "var(--color-text)",
                  }}
                >
                  {t.title}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-subtle)" }}>{formatDue(t.due_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* All tasks table */}
      <section>
        <h2 style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)", letterSpacing: "0.02em", textTransform: "uppercase" }}>
          All tasks
        </h2>
      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Add tasks and assign them to teammates from Settings."
          action={<Button onClick={() => setAddOpen(true)}>Add task</Button>}
        />
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due</TableHead>
                <TableHead style={{ width: 120 }} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell style={{ fontWeight: "var(--font-medium)" }}>{t.title}</TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--color-surface-elevated)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {STATUS_LABELS[(t.status as TaskStatus) ?? "todo"] ?? t.status}
                    </span>
                  </TableCell>
                  <TableCell style={{ color: "var(--color-text-muted)" }}>{t.assignee_name ?? "—"}</TableCell>
                  <TableCell style={{ color: "var(--color-text-muted)" }}>{formatDue(t.due_at)}</TableCell>
                  <TableCell>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <Button variant="secondary" onClick={() => openEdit(t)} disabled={submitting}>
                        Edit
                      </Button>
                      <Button variant="secondary" onClick={() => setDeleteId(t.id)} disabled={submitting} style={{ color: "var(--color-error, #b91c1c)" }}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      </section>

      <Dialog open={granolaOpen} onClose={() => !submitting && (setGranolaOpen(false), setGranolaSelectedId(""))} title="Import from Granola">
        <p style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Choose a transcript to import action items as tasks. Due date applies to all imported tasks.
        </p>
        {granolaLoadingTools ? (
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Connecting to Granola…</p>
        ) : granolaToolsError ? (
          <div
            style={{
              padding: "var(--space-3)",
              background: "var(--color-error-subtle, rgba(185, 28, 28, 0.08))",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-error-border, rgba(185, 28, 28, 0.3))",
            }}
          >
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-error, #b91c1c)", fontWeight: "var(--font-medium)" }}>
              {granolaToolsError}
            </p>
            <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
              See Settings → Granola MCP for OAuth details. To use a bearer token, add GRANOLA_API_TOKEN to .env.local and restart.
            </p>
          </div>
        ) : granolaListTools.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", display: "block", marginBottom: "var(--space-2)" }}>List tool</label>
              <select
                value={granolaSelectedListTool}
                onChange={(e) => { setGranolaSelectedListTool(e.target.value); setGranolaListError(null); setGranolaListFetched(false); }}
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-sm)",
                  backgroundColor: "var(--color-bg)",
                }}
              >
                {granolaListTools.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            {granolaSelectedListTool === "search_meetings" && (
              <div>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", display: "block", marginBottom: "var(--space-2)" }}>Search query (optional)</label>
                <input
                  type="text"
                  value={granolaSearchQuery}
                  onChange={(e) => setGranolaSearchQuery(e.target.value)}
                  placeholder="* or keyword"
                  style={{ width: "100%", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)", backgroundColor: "var(--color-bg)" }}
                />
              </div>
            )}
            <Button type="button" variant="secondary" onClick={handleLoadGranolaMeetings} disabled={granolaLoadingList || !granolaSelectedListTool}>
              {granolaLoadingList ? "Loading…" : "Load meetings"}
            </Button>
            {granolaListError && (
              <div style={{ padding: "var(--space-3)", background: "var(--color-error-subtle, rgba(185, 28, 28, 0.08))", borderRadius: "var(--radius-md)", border: "1px solid var(--color-error-border, rgba(185, 28, 28, 0.3))" }}>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-error, #b91c1c)", fontWeight: "var(--font-medium)" }}>{granolaListError}</p>
              </div>
            )}
            {granolaListFetched && granolaDocs.length === 0 && !granolaListError && (
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>No meetings returned. Try another list tool above.</p>
            )}
            {granolaListFetched && granolaDocs.length > 0 && (
          <form onSubmit={handleImportFromGranola} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", display: "block", marginBottom: "var(--space-2)" }}>Transcript</label>
              <select
                value={granolaSelectedId}
                onChange={(e) => setGranolaSelectedId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-sm)",
                  backgroundColor: "var(--color-bg)",
                }}
              >
                <option value="">Select one…</option>
                {granolaDocs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title ?? d.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", display: "block", marginBottom: "var(--space-2)" }}>Due</label>
              <select
                value={granolaDue}
                onChange={(e) => setGranolaDue(e.target.value as "today" | "week")}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-sm)",
                  backgroundColor: "var(--color-bg)",
                }}
              >
                <option value="today">Today</option>
                <option value="week">End of week (Friday)</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
              <Button type="button" variant="secondary" onClick={() => setGranolaOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !granolaSelectedId}>
                {submitting ? "Importing…" : "Import tasks"}
              </Button>
            </div>
          </form>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>No MCP tools available. Check Settings → Granola MCP.</p>
        )}
      </Dialog>

      <Dialog open={meetingOpen} onClose={() => !submitting && (setMeetingOpen(false), setMeetingPaste(""))} title="Add from meeting">
        <p style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Paste action items from Granola or meeting notes. One task per line.
        </p>
        <form onSubmit={handleAddFromMeeting} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <textarea
            value={meetingPaste}
            onChange={(e) => setMeetingPaste(e.target.value)}
            placeholder={"Follow up with client\nSend proposal by Friday\nUpdate roadmap"}
            rows={8}
            style={{
              width: "100%",
              padding: "var(--space-3)",
              fontSize: "var(--text-sm)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <div>
            <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", display: "block", marginBottom: "var(--space-2)" }}>Due</label>
            <select
              value={meetingDue}
              onChange={(e) => setMeetingDue(e.target.value as "today" | "week")}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                fontSize: "var(--text-sm)",
                backgroundColor: "var(--color-bg)",
              }}
            >
              <option value="today">Today</option>
              <option value="week">End of week (Friday)</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <Button type="button" variant="secondary" onClick={() => setMeetingOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || meetingLines.length === 0}>
              {submitting ? "Adding…" : `Add ${meetingLines.length} task${meetingLines.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={addOpen} onClose={() => !submitting && setAddOpen(false)} title="Add task">
        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Title *</label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              backgroundColor: "var(--color-bg)",
            }}
          >
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Assignee</label>
          <select
            value={form.assignee_id}
            onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              backgroundColor: "var(--color-bg)",
            }}
          >
            <option value="">No assignee</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Due date</label>
          <Input
            type="datetime-local"
            value={form.due_at}
            onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
          />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Notes</label>
          <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.title.trim()}>
              {submitting ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !submitting && (setEditOpen(false), setEditing(null))} title="Edit task">
        <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Title *</label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              backgroundColor: "var(--color-bg)",
            }}
          >
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Assignee</label>
          <select
            value={form.assignee_id}
            onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              backgroundColor: "var(--color-bg)",
            }}
          >
            <option value="">No assignee</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Due date</label>
          <Input type="datetime-local" value={form.due_at} onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))} />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Notes</label>
          <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <Button type="button" variant="secondary" onClick={() => (setEditOpen(false), setEditing(null))} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.title.trim()}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={deleteId !== null} onClose={() => !submitting && setDeleteId(null)} title="Delete task">
        <p style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Delete &quot;{tasks.find((t) => t.id === deleteId)?.title ?? "this task"}&quot;? This can&apos;t be undone.
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={() => setDeleteId(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={submitting} style={{ backgroundColor: "var(--color-error, #b91c1c)" }}>
            {submitting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
