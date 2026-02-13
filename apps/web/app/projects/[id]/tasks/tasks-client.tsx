"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { FromGranolaTrigger } from "../from-granola-trigger";

const STATUS_PILL_STYLE: Record<TaskStatus, React.CSSProperties> = {
  todo: { background: "var(--color-bg-muted)", color: "var(--color-text-muted)" },
  in_progress: { background: "rgba(59, 130, 246, 0.12)", color: "var(--color-accent)" },
  done: { background: "var(--color-success-muted)", color: "var(--color-success)" },
  cancelled: { background: "var(--color-bg-muted)", color: "var(--color-text-subtle)" },
};

export type TaskRow = {
  id: string;
  title: string;
  status: string;
  assignee_id: string | null;
  assignee_name: string | null;
  due_at: string | null;
  notes: string | null;
  source_meeting_label: string | null;
  source_meeting_id: string | null;
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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<"today" | "this_week" | "this_month" | "all">("this_week");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [boardCollapsed, setBoardCollapsed] = useState<Set<TaskStatus>>(new Set(["done", "cancelled"]));
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [boardDropTarget, setBoardDropTarget] = useState<TaskStatus | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
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
          source_meeting_label: null,
          source_meeting_id: null,
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
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const todayTasks = tasks.filter(
    (t) =>
      (t.status === "todo" || t.status === "in_progress") &&
      t.due_at &&
      t.due_at >= startOfToday &&
      t.due_at <= endOfToday
  );
  const weekTasks = tasks.filter(
    (t) =>
      (t.status === "todo" || t.status === "in_progress") &&
      t.due_at &&
      t.due_at >= startOfToday &&
      t.due_at <= endOfWeek
  );
  const monthTasks = tasks.filter(
    (t) =>
      (t.status === "todo" || t.status === "in_progress") &&
      t.due_at &&
      t.due_at >= startOfToday &&
      t.due_at <= endOfMonth
  );

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

  const displayedTasks =
    viewFilter === "today"
      ? todayTasks
      : viewFilter === "this_week"
        ? weekTasks
        : viewFilter === "this_month"
          ? monthTasks
          : tasks;
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => {
    if (selectedIds.size === displayedTasks.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(displayedTasks.map((t) => t.id)));
  };
  const bulkSetStatus = useCallback(
    async (status: TaskStatus) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      setSubmitting(true);
      const results = await Promise.all(ids.map((id) => updateTask(projectId, id, { status })));
      setSubmitting(false);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) addToast(`${failed.length} update(s) failed.`, "error");
      else addToast(`${ids.length} task${ids.length === 1 ? "" : "s"} updated.`, "success");
      setSelectedIds(new Set());
      setTasks((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, status } : t)));
      router.refresh();
    },
    [projectId, selectedIds, router, addToast]
  );
  const bulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setSubmitting(true);
    const results = await Promise.all(ids.map((id) => deleteTask(projectId, id)));
    setSubmitting(false);
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) addToast(`${failed.length} delete(s) failed.`, "error");
    else addToast(`${ids.length} task${ids.length === 1 ? "" : "s"} deleted.`, "success");
    setSelectedIds(new Set());
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    router.refresh();
  }, [projectId, selectedIds, router, addToast]);

  const handleInlineStatusChange = async (taskId: string, status: TaskStatus) => {
    const result = await updateTask(projectId, taskId, { status });
    if (result.ok) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
      router.refresh();
    } else addToast(result.error, "error");
  };
  const handleInlineAssigneeChange = async (taskId: string, assignee_id: string | null) => {
    const result = await updateTask(projectId, taskId, { assignee_id });
    if (result.ok) {
      const assignee = contacts.find((c) => c.id === assignee_id);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assignee_id, assignee_name: assignee?.name ?? null } : t)));
      router.refresh();
    } else addToast(result.error, "error");
  };

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    const n = displayedTasks.length;
    el.indeterminate = n > 0 && selectedIds.size > 0 && selectedIds.size < n;
  }, [selectedIds.size, displayedTasks.length]);

  const handleBoardDrop = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;
      setDraggedTaskId(null);
      setBoardDropTarget(null);
      const result = await updateTask(projectId, taskId, { status: newStatus });
      if (result.ok) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
        router.refresh();
      } else addToast(result.error, "error");
    },
    [projectId, tasks, router, addToast]
  );

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <Link
          href={`/projects/${projectId}`}
          style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none", fontWeight: 500 }}
        >
          ← Overview
        </Link>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <FromGranolaTrigger projectId={projectId} />
          <Button variant="secondary" onClick={() => setMeetingOpen(true)}>
            Add from meeting
          </Button>
          <Button onClick={() => setAddOpen(true)}>Add task</Button>
        </div>
      </div>

      {/* View mode (List | Board) + filter (This week | All) + bulk toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <div
            role="tablist"
            style={{
              display: "inline-flex",
              padding: "var(--space-0)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-muted)",
            }}
          >
            {(["list", "board"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "var(--space-2) var(--space-4)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  background: viewMode === mode ? "var(--color-bg-elevated)" : "transparent",
                  color: viewMode === mode ? "var(--color-text)" : "var(--color-text-muted)",
                  boxShadow: viewMode === mode ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {mode === "list" ? "List" : "Board"}
              </button>
            ))}
          </div>
          <div
            role="tablist"
            style={{
              display: "inline-flex",
              padding: "var(--space-0)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-muted)",
            }}
          >
            {(["today", "this_week", "this_month", "all"] as const).map((view) => (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={viewFilter === view}
                onClick={() => setViewFilter(view)}
                style={{
                  padding: "var(--space-2) var(--space-4)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  background: viewFilter === view ? "var(--color-bg-elevated)" : "transparent",
                  color: viewFilter === view ? "var(--color-text)" : "var(--color-text-muted)",
                  boxShadow: viewFilter === view ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {view === "today" ? "Today" : view === "this_week" ? "This week" : view === "this_month" ? "This month" : "All"}
              </button>
            ))}
          </div>
        </div>
        {selectedIds.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {selectedIds.size} selected
            </span>
            <Button variant="secondary" onClick={() => bulkSetStatus("done")} disabled={submitting}>
              Mark done
            </Button>
            <Button variant="secondary" onClick={() => bulkSetStatus("todo")} disabled={submitting}>
              Mark to do
            </Button>
            <Button variant="secondary" onClick={bulkDelete} disabled={submitting} style={{ color: "var(--color-error)" }}>
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setSelectedIds(new Set())} disabled={submitting}>
              Clear
            </Button>
          </div>
        )}
        {selectedIds.size === 0 && selectedTaskId && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              onClick={() => {
                const t = tasks.find((x) => x.id === selectedTaskId);
                if (t) openEdit(t);
              }}
              disabled={submitting}
              style={{ padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-sm)" }}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDeleteId(selectedTaskId)}
              disabled={submitting}
              style={{ padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-error)" }}
            >
              Delete
            </Button>
            <button
              type="button"
              onClick={() => setSelectedTaskId(null)}
              style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* Single table: checkbox, quick-done, title, status, assignee, due, actions */}
      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Add tasks, paste from meeting notes, or import from Granola. Assign to teammates in Settings."
          action={<Button onClick={() => setAddOpen(true)}>Add task</Button>}
        />
      ) : displayedTasks.length === 0 ? (
        <p style={{ margin: 0, padding: "var(--space-6)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textAlign: "center" }}>
          {viewFilter === "today"
            ? "No tasks due today. Try This week, This month, or All."
            : viewFilter === "this_week"
              ? "No tasks due this week. Try This month or All."
              : viewFilter === "this_month"
                ? "No tasks due this month. Try All."
                : "No tasks."}
        </p>
      ) : viewMode === "board" ? (
        <div style={{ display: "flex", gap: "var(--space-4)", overflowX: "auto", paddingBottom: "var(--space-2)" }}>
          {(["todo", "in_progress", "done", "cancelled"] as const).map((status) => {
            const columnTasks = displayedTasks.filter((t) => t.status === status);
            const isCollapsed = boardCollapsed.has(status);
            const isDropTarget = boardDropTarget === status;
            const toggleCollapsed = () => {
              setBoardCollapsed((prev) => {
                const next = new Set(prev);
                if (next.has(status)) next.delete(status);
                else next.add(status);
                return next;
              });
            };
            return (
              <div
                key={status}
                onDragOver={isCollapsed ? undefined : (e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setBoardDropTarget(status);
                }}
                onDragLeave={isCollapsed ? undefined : () => setBoardDropTarget(null)}
                onDrop={isCollapsed ? undefined : (e) => {
                  e.preventDefault();
                  setBoardDropTarget(null);
                  const taskId = e.dataTransfer.getData("taskId");
                  if (taskId) handleBoardDrop(taskId, status);
                }}
                style={{
                  minWidth: isCollapsed ? 100 : 260,
                  flex: isCollapsed ? "0 0 auto" : "1 1 0",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: isDropTarget ? "var(--color-bg-muted)" : "var(--color-bg-elevated)",
                  padding: "var(--space-3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-semibold)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-1)",
                    ...STATUS_PILL_STYLE[status],
                    padding: "var(--space-1) var(--space-2)",
                    borderRadius: "var(--radius-sm)",
                    alignSelf: "flex-start",
                  }}
                >
                  {STATUS_LABELS[status]} ({columnTasks.length})
                </div>
                {isCollapsed ? (
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    style={{
                      padding: "var(--space-2)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-accent)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    Expand
                  </button>
                ) : (
                  <>
                    {(status === "done" || status === "cancelled") && (
                      <button
                        type="button"
                        onClick={toggleCollapsed}
                        style={{
                          alignSelf: "flex-start",
                          padding: "var(--space-1) var(--space-2)",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Collapse
                      </button>
                    )}
                {columnTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("taskId", t.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggedTaskId(t.id);
                    }}
                    onDragEnd={() => setDraggedTaskId(null)}
                    onClick={() => openEdit(t)}
                    style={{
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      background: draggedTaskId === t.id ? "var(--color-bg-muted)" : "var(--color-bg)",
                      cursor: draggedTaskId === t.id ? "grabbing" : "grab",
                      opacity: draggedTaskId === t.id ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
                      <input
                        type="radio"
                        name="task-action-board"
                        checked={selectedTaskId === t.id}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(t.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${t.title.slice(0, 30)}`}
                        style={{ cursor: "pointer", marginTop: 2, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: "var(--font-medium)",
                            fontSize: "var(--text-sm)",
                            textDecoration: t.status === "done" ? "line-through" : "none",
                            color: t.status === "done" ? "var(--color-text-muted)" : "var(--color-text)",
                          }}
                        >
                          {t.title}
                        </div>
                        {(t.source_meeting_label || t.source_meeting_id) && (
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                            From:{" "}
                            {t.source_meeting_id ? (
                              <Link
                                href={`/projects/${projectId}/import/granola?meeting=${encodeURIComponent(t.source_meeting_id)}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: "var(--color-accent)", textDecoration: "none" }}
                              >
                                {t.source_meeting_label ?? "View meeting"}
                              </Link>
                            ) : (
                              t.source_meeting_label
                            )}
                          </div>
                        )}
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                          {t.assignee_name ?? "—"} · {formatDue(t.due_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            overflowX: "auto",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            background: "var(--color-bg-elevated)",
          }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 40, paddingLeft: "var(--space-3)" }}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={displayedTasks.length > 0 && selectedIds.size === displayedTasks.length}
                    onChange={selectAll}
                    aria-label="Select all"
                    style={{ cursor: "pointer", width: 16, height: 16 }}
                  />
                </TableHead>
                <TableHead style={{ width: 40 }} />
                <TableHead>Title</TableHead>
                <TableHead style={{ minWidth: 140 }}>From meeting</TableHead>
                <TableHead style={{ minWidth: 120 }}>Status</TableHead>
                <TableHead style={{ minWidth: 120 }}>Assignee</TableHead>
                <TableHead style={{ minWidth: 88 }}>Due</TableHead>
                <TableHead style={{ width: 56 }} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTasks.map((t) => (
                <TableRow
                  key={t.id}
                  className="tasks-table-row"
                >
                  <TableCell style={{ paddingLeft: "var(--space-3)" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      aria-label={`Select ${t.title.slice(0, 30)}`}
                      style={{ cursor: "pointer", width: 16, height: 16 }}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      aria-label={t.status === "done" ? "Mark not done" : "Mark done"}
                      onClick={() => handleToggleDone(t)}
                      disabled={togglingId === t.id}
                      style={{
                        width: 18,
                        height: 18,
                        flexShrink: 0,
                        borderRadius: "var(--radius-sm)",
                        border: "2px solid var(--color-border)",
                        backgroundColor: t.status === "done" ? "var(--color-success)" : "transparent",
                        cursor: togglingId === t.id ? "wait" : "pointer",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontWeight: "var(--font-medium)",
                        fontSize: "var(--text-sm)",
                        textDecoration: t.status === "done" ? "line-through" : "none",
                        color: t.status === "done" ? "var(--color-text-muted)" : "var(--color-text)",
                      }}
                    >
                      {t.title}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {t.source_meeting_label || t.source_meeting_id ? (
                      t.source_meeting_id ? (
                        <Link
                          href={`/projects/${projectId}/import/granola?meeting=${encodeURIComponent(t.source_meeting_id)}`}
                          style={{ color: "var(--color-accent)", textDecoration: "none" }}
                        >
                          {t.source_meeting_label ?? "View meeting context"}
                        </Link>
                      ) : (
                        t.source_meeting_label ?? "—"
                      )
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <select
                      value={(t.status as TaskStatus) ?? "todo"}
                      onChange={(e) => handleInlineStatusChange(t.id, e.target.value as TaskStatus)}
                      style={{
                        padding: "2px 6px",
                        fontSize: "var(--text-xs)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg)",
                        cursor: "pointer",
                        ...STATUS_PILL_STYLE[(t.status as TaskStatus) ?? "todo"],
                      }}
                    >
                      {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      value={t.assignee_id ?? ""}
                      onChange={(e) => handleInlineAssigneeChange(t.id, e.target.value || null)}
                      style={{
                        padding: "2px 6px",
                        fontSize: "var(--text-xs)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg)",
                        color: "var(--color-text-muted)",
                        cursor: "pointer",
                        minWidth: 90,
                      }}
                    >
                      <option value="">—</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {formatDue(t.due_at)}
                  </TableCell>
                  <TableCell style={{ paddingRight: "var(--space-3)" }}>
                    <input
                      type="radio"
                      name="task-action-row"
                      checked={selectedTaskId === t.id}
                      onChange={() => setSelectedTaskId(t.id)}
                      aria-label={`Select ${t.title.slice(0, 30)} for Edit or Delete`}
                      style={{ cursor: "pointer", width: 16, height: 16 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
          {(editing?.source_meeting_label || editing?.source_meeting_id) && (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              From meeting:{" "}
              {editing?.source_meeting_id ? (
                <Link
                  href={`/projects/${projectId}/import/granola?meeting=${encodeURIComponent(editing.source_meeting_id)}`}
                  style={{ color: "var(--color-accent)", fontWeight: "var(--font-medium)", textDecoration: "none" }}
                >
                  {editing.source_meeting_label ?? "View full context"}
                </Link>
              ) : (
                <strong style={{ color: "var(--color-text)" }}>{editing?.source_meeting_label}</strong>
              )}
            </p>
          )}
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
