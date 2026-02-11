"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Dialog, EmptyState, useToast } from "@/components/ui";
import { createFigmaLink, deleteFigmaLink } from "./figma-actions";

export type FigmaLinkRow = {
  id: string;
  url: string;
  name: string;
};

export function FigmaSection({ projectId, initialLinks }: { projectId: string; initialLinks: FigmaLinkRow[] }) {
  const [links, setLinks] = useState<FigmaLinkRow[]>(initialLinks);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ url: "", name: "" });
  const { addToast } = useToast();
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url.trim()) return;
    setSubmitting(true);
    const result = await createFigmaLink(projectId, { url: form.url.trim(), name: form.name.trim() });
    setSubmitting(false);
    if (result.ok) {
      setAddOpen(false);
      setForm({ url: "", name: "" });
      router.refresh();
      addToast("Figma link added.", "success");
      setLinks((prev) => [...prev, { id: result.id, url: form.url.trim(), name: form.name.trim() }]);
    } else {
      addToast(result.error, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    const result = await deleteFigmaLink(projectId, deleteId);
    setSubmitting(false);
    if (result.ok) {
      setDeleteId(null);
      router.refresh();
      addToast("Link removed.", "success");
      setLinks((prev) => prev.filter((l) => l.id !== deleteId));
    } else {
      addToast(result.error, "error");
    }
  };

  const displayName = (link: FigmaLinkRow) => link.name || link.url.replace(/^https?:\/\//, "").slice(0, 40) + (link.url.length > 40 ? "…" : "");

  return (
    <div id="figma" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>Figma</h3>
        <Button onClick={() => setAddOpen(true)}>Add Figma link</Button>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
        Add Figma file or prototype URLs. They’ll appear on the dashboard. Optional name for each link.
      </p>
      {links.length === 0 ? (
        <EmptyState
          title="No Figma links yet"
          description="Add a Figma file or prototype URL."
          action={<Button onClick={() => setAddOpen(true)}>Add Figma link</Button>}
        />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {links.map((link) => (
            <li
              key={link.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "var(--space-3)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: "var(--font-medium)", color: "var(--color-primary)", textDecoration: "none" }}>
                {displayName(link)}
              </a>
              <Button variant="secondary" onClick={() => setDeleteId(link.id)} disabled={submitting} style={{ color: "var(--color-error, #b91c1c)" }}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={addOpen} onClose={() => !submitting && setAddOpen(false)} title="Add Figma link">
        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>URL *</label>
          <Input type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://www.figma.com/…" required />
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>Name (optional)</label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Homepage mockup" />
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.url.trim()}>
              {submitting ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={deleteId !== null} onClose={() => !submitting && setDeleteId(null)} title="Remove link">
        <p style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Remove &quot;{(() => { const l = links.find((x) => x.id === deleteId); return l ? displayName(l) : "this link"; })()}&quot;?
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
