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
import { createArtifact, updateArtifact, deleteArtifact, type ArtifactType } from "./actions";

export type ArtifactRow = {
  id: string;
  title: string;
  body: string;
  artifact_type: string;
  occurred_at: string | null;
};

const TYPE_LABELS: Record<ArtifactType, string> = {
  note: "Note",
  meeting_summary: "Meeting summary",
  plan: "Plan",
  design: "Design",
};

export function ArtifactsClient({ projectId, initialArtifacts }: { projectId: string; initialArtifacts: ArtifactRow[] }) {
  const [artifacts, setArtifacts] = useState<ArtifactRow[]>(initialArtifacts);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ArtifactRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", artifact_type: "note" as ArtifactType, occurred_at: "" });
  const { addToast } = useToast();
  const router = useRouter();

  const openEdit = (a: ArtifactRow) => {
    setEditing(a);
    setForm({
      title: a.title,
      body: a.body,
      artifact_type: (a.artifact_type as ArtifactType) || "note",
      occurred_at: a.occurred_at ? a.occurred_at.slice(0, 16) : "",
    });
    setEditOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    const result = await createArtifact(projectId, {
      title: form.title.trim(),
      body: form.body,
      artifact_type: form.artifact_type,
      occurred_at: form.occurred_at || null,
    });
    setSubmitting(false);
    if (result.ok) {
      setAddOpen(false);
      setForm({ title: "", body: "", artifact_type: "note", occurred_at: "" });
      router.refresh();
      addToast("Artifact added.", "success");
      setArtifacts((prev) => [
        ...prev,
        {
          id: result.id,
          title: form.title.trim(),
          body: form.body,
          artifact_type: form.artifact_type,
          occurred_at: form.occurred_at || null,
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
    const result = await updateArtifact(projectId, editing.id, {
      title: form.title.trim(),
      body: form.body,
      artifact_type: form.artifact_type,
      occurred_at: form.occurred_at || null,
    });
    setSubmitting(false);
    if (result.ok) {
      setEditOpen(false);
      setEditing(null);
      router.refresh();
      addToast("Artifact updated.", "success");
      setArtifacts((prev) =>
        prev.map((a) =>
          a.id === editing.id
            ? { ...a, title: form.title.trim(), body: form.body, artifact_type: form.artifact_type, occurred_at: form.occurred_at || null }
            : a
        )
      );
    } else {
      addToast(result.error, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    const result = await deleteArtifact(projectId, deleteId);
    setSubmitting(false);
    if (result.ok) {
      setDeleteId(null);
      router.refresh();
      addToast("Artifact deleted.", "success");
      setArtifacts((prev) => prev.filter((a) => a.id !== deleteId));
    } else {
      addToast(result.error, "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <Link href={`/projects/${projectId}`} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}>
          ← Dashboard
        </Link>
        <Button onClick={() => setAddOpen(true)}>Add artifact</Button>
      </div>
      {artifacts.length === 0 ? (
        <EmptyState
          title="No artifacts yet"
          description="Add notes, meeting summaries, plans, or design links."
          action={<Button onClick={() => setAddOpen(true)}>Add artifact</Button>}
        />
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>When</TableHead>
                <TableHead style={{ width: 120 }} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {artifacts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell style={{ fontWeight: "var(--font-medium)" }}>{a.title}</TableCell>
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
                      {TYPE_LABELS[(a.artifact_type as ArtifactType) ?? "note"] ?? a.artifact_type}
                    </span>
                  </TableCell>
                  <TableCell style={{ color: "var(--color-text-muted)" }}>
                    {a.occurred_at ? new Date(a.occurred_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <Button variant="secondary" onClick={() => openEdit(a)} disabled={submitting}>
                        Edit
                      </Button>
                      <Button variant="secondary" onClick={() => setDeleteId(a.id)} disabled={submitting} style={{ color: "var(--color-error, #b91c1c)" }}>
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

      <Dialog open={addOpen} onClose={() => !submitting && setAddOpen(false)} title="Add artifact">
        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Title *</label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Type</label>
          <select
            value={form.artifact_type}
            onChange={(e) => setForm((f) => ({ ...f, artifact_type: e.target.value as ArtifactType }))}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              backgroundColor: "var(--color-bg)",
            }}
          >
            {(Object.keys(TYPE_LABELS) as ArtifactType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Body</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Content…"
            rows={4}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              backgroundColor: "var(--color-bg)",
            }}
          />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>When (for meetings)</label>
          <Input type="datetime-local" value={form.occurred_at} onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))} />
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

      <Dialog open={editOpen} onClose={() => !submitting && (setEditOpen(false), setEditing(null))} title="Edit artifact">
        <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Title *</label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Type</label>
          <select
            value={form.artifact_type}
            onChange={(e) => setForm((f) => ({ ...f, artifact_type: e.target.value as ArtifactType }))}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              backgroundColor: "var(--color-bg)",
            }}
          >
            {(Object.keys(TYPE_LABELS) as ArtifactType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Body</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Content…"
            rows={4}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              backgroundColor: "var(--color-bg)",
            }}
          />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>When</label>
          <Input type="datetime-local" value={form.occurred_at} onChange={(e) => setForm((f) => ({ ...f, occurred_at: e.target.value }))} />
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

      <Dialog open={deleteId !== null} onClose={() => !submitting && setDeleteId(null)} title="Delete artifact">
        <p style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Delete &quot;{artifacts.find((a) => a.id === deleteId)?.title ?? "this artifact"}&quot;?
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
