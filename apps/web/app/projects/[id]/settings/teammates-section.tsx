"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState, useToast } from "@/components/ui";
import { createContact, updateContact, deleteContact } from "./actions";

export type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  notes: string | null;
};

export function TeammatesSection({ projectId, initialContacts }: { projectId: string; initialContacts: ContactRow[] }) {
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "", notes: "" });
  const { addToast } = useToast();
  const router = useRouter();

  const openEdit = (c: ContactRow) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email ?? "", role: c.role ?? "", notes: c.notes ?? "" });
    setEditOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    const result = await createContact(projectId, {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      role: form.role.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      setAddOpen(false);
      setForm({ name: "", email: "", role: "", notes: "" });
      router.refresh();
      addToast("Teammate added.", "success");
      setContacts((prev) => [...prev, { id: result.id, name: form.name.trim(), email: form.email.trim() || null, role: form.role.trim() || null, notes: form.notes.trim() || null }]);
    } else {
      addToast(result.error, "error");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !form.name.trim()) return;
    setSubmitting(true);
    const result = await updateContact(projectId, editing.id, {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      role: form.role.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      setEditOpen(false);
      setEditing(null);
      router.refresh();
      addToast("Teammate updated.", "success");
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? { ...c, name: form.name.trim(), email: form.email.trim() || null, role: form.role.trim() || null, notes: form.notes.trim() || null }
            : c
        )
      );
    } else {
      addToast(result.error, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    const result = await deleteContact(projectId, deleteId);
    setSubmitting(false);
    if (result.ok) {
      setDeleteId(null);
      router.refresh();
      addToast("Teammate removed.", "success");
      setContacts((prev) => prev.filter((c) => c.id !== deleteId));
    } else {
      addToast(result.error, "error");
    }
  };

  return (
    <div id="teammates" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>Teammates</h3>
        <Button onClick={() => setAddOpen(true)}>Add teammate</Button>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
        Contacts you can assign tasks to. Add, edit, or remove below.
      </p>
      {contacts.length === 0 ? (
        <EmptyState
          title="No teammates yet"
          description="Add teammates so you can assign tasks to them."
          action={<Button onClick={() => setAddOpen(true)}>Add teammate</Button>}
        />
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead style={{ width: 80 }} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell style={{ fontWeight: "var(--font-medium)" }}>{c.name}</TableCell>
                  <TableCell style={{ color: "var(--color-text-muted)" }}>{c.email ?? "—"}</TableCell>
                  <TableCell style={{ color: "var(--color-text-muted)" }}>{c.role ?? "—"}</TableCell>
                  <TableCell>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <Button variant="secondary" onClick={() => openEdit(c)} disabled={submitting}>
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setDeleteId(c.id)}
                        disabled={submitting}
                        style={{ color: "var(--color-error, #b91c1c)" }}
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addOpen} onClose={() => !submitting && setAddOpen(false)} title="Add teammate">
        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Name *</label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Email</label>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Role</label>
          <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Designer" />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Notes</label>
          <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.name.trim()}>
              {submitting ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !submitting && (setEditOpen(false), setEditing(null))} title="Edit teammate">
        <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Name *</label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Email</label>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Role</label>
          <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Designer" />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Notes</label>
          <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <Button type="button" variant="secondary" onClick={() => (setEditOpen(false), setEditing(null))} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.name.trim()}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={deleteId !== null}
        onClose={() => !submitting && setDeleteId(null)}
        title="Remove teammate"
      >
        <p style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Remove {contacts.find((c) => c.id === deleteId)?.name ?? "this teammate"}? They will no longer appear in assignee lists.
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
