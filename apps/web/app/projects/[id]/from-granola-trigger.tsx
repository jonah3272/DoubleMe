"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, useToast } from "@/components/ui";
import { listGranolaDocumentsForProject, importFromGranolaIntoProject, type GranolaDocument } from "./granola-actions";

export function FromGranolaTrigger({ projectId, variant = "button" }: { projectId: string; variant?: "button" | "link" }) {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<GranolaDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [createTasks, setCreateTasks] = useState(true);
  const [createNote, setCreateNote] = useState(true);
  const [taskDueAt, setTaskDueAt] = useState<"today" | "week">("week");
  const [listError, setListError] = useState<string | null>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const handleOpen = async () => {
    setOpen(true);
    setDocuments([]);
    setSelectedId("");
    setListError(null);
    setLoading(true);
    const result = await listGranolaDocumentsForProject();
    setLoading(false);
    if (result.ok) {
      setDocuments(result.documents);
    } else {
      setListError(result.error);
      addToast(result.error, "error");
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!createTasks && !createNote) {
      addToast("Choose at least one: create tasks or save as note.", "error");
      return;
    }
    setSubmitting(true);
    const result = await importFromGranolaIntoProject(projectId, selectedId, {
      createTasks,
      createNote,
      taskDueAt: createTasks ? taskDueAt : undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      setOpen(false);
      router.refresh();
      const parts: string[] = [];
      if (result.tasksCreated != null) parts.push(`${result.tasksCreated} task${result.tasksCreated === 1 ? "" : "s"}`);
      if (result.artifactId) parts.push("1 note");
      addToast(`From Granola: ${parts.join(", ")} added.`, "success");
    } else {
      addToast(result.error, "error");
    }
  };

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={handleOpen}
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            textDecoration: "none",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            font: "inherit",
          }}
        >
          From Granola →
        </button>
      ) : (
        <Button variant="secondary" onClick={handleOpen} type="button">
          From Granola
        </Button>
      )}
      <Dialog
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="From Granola"
      >
        <p style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Pick a meeting transcript to create tasks and/or a meeting note in this project.
        </p>
        {loading ? (
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Loading transcripts…</p>
        ) : listError ? (
          <div
            style={{
              padding: "var(--space-3)",
              background: "var(--color-error-subtle, rgba(185, 28, 28, 0.08))",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-error-border, rgba(185, 28, 28, 0.3))",
            }}
          >
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-error, #b91c1c)", fontWeight: "var(--font-medium)" }}>
              {listError}
            </p>
            <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
              See Settings → Granola MCP for the connection URL and OAuth details. To use a bearer token from another tool, add GRANOLA_API_TOKEN to .env.local and restart.
            </p>
          </div>
        ) : documents.length === 0 ? (
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            No transcripts found. Configure Granola MCP in Settings (e.g. GRANOLA_MCP_URL in .env.local).
          </p>
        ) : (
          <form onSubmit={handleImport} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", display: "block", marginBottom: "var(--space-2)" }}>
                Transcript
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
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
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title ?? d.id}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={createTasks}
                  onChange={(e) => setCreateTasks(e.target.checked)}
                />
                Create tasks from action items
              </label>
              {createTasks && (
                <div style={{ marginLeft: "var(--space-6)" }}>
                  <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: "var(--space-1)" }}>
                    Due
                  </label>
                  <select
                    value={taskDueAt}
                    onChange={(e) => setTaskDueAt(e.target.value as "today" | "week")}
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
              )}
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={createNote}
                  onChange={(e) => setCreateNote(e.target.checked)}
                />
                Save as meeting note (artifact)
              </label>
            </div>
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !selectedId}>
                {submitting ? "Importing…" : "Import"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
