"use client";

import { useState } from "react";
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
import { createTask, updateTask, deleteTask, type TaskStatus } from "./actions";

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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    status: "todo" as TaskStatus,
    assignee_id: "",
    due_at: "",
    notes: "",
  });
  const { addToast } = useToast();
  const router = useRouter();

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <Link href={`/projects/${projectId}`} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}>
          ← Overview
        </Link>
        <Button onClick={() => setAddOpen(true)}>Add task</Button>
      </div>
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
