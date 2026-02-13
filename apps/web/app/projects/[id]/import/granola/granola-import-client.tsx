"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, useToast } from "@/components/ui";
import {
  getGranolaConnected,
  getGranolaMcpToolsForProject,
  listGranolaDocumentsForProject,
  getGranolaTranscriptForProject,
  synthesizeGranolaTranscriptAction,
  importFromGranolaIntoProject,
  type GranolaDocument,
} from "../../granola-actions";

export function GranolaImportClient({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const { addToast } = useToast();

  const [connected, setConnected] = useState<boolean | null>(null);
  const [listTools, setListTools] = useState<string[]>([]);
  const [selectedListTool, setSelectedListTool] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<GranolaDocument[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listFetched, setListFetched] = useState(false);
  const [listDebug, setListDebug] = useState<string | null>(null);
  const [listRawPreview, setListRawPreview] = useState<string | null>(null);
  const [extractedWithKimi, setExtractedWithKimi] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);

  const [selectedId, setSelectedId] = useState("");
  const [transcript, setTranscript] = useState<{ title: string; content: string; created_at?: string } | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const [synthesized, setSynthesized] = useState<string | null>(null);
  const [loadingSynthesize, setLoadingSynthesize] = useState(false);
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"summary" | "raw">("summary");

  const [createTasks, setCreateTasks] = useState(true);
  const [createNote, setCreateNote] = useState(true);
  const [taskDueAt, setTaskDueAt] = useState<"today" | "week">("week");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const conn = await getGranolaConnected();
      if (conn.ok) setConnected(conn.connected);
      if (conn.ok && conn.connected) {
        const tools = await getGranolaMcpToolsForProject();
        if (tools.ok) {
          setListTools(tools.listTools);
          setSelectedListTool(tools.defaultListTool ?? tools.listTools[0] ?? "");
        }
      }
      setLoadingTools(false);
    })();
  }, []);

  async function handleLoadMeetings() {
    if (!selectedListTool) return;
    setListError(null);
    setListDebug(null);
    setListRawPreview(null);
    setShowRawResponse(false);
    setLoadingList(true);
    const result = await listGranolaDocumentsForProject(selectedListTool, searchQuery || undefined);
    setLoadingList(false);
    setListFetched(true);
    if (result.ok) {
      setDocuments(result.documents);
      setListDebug(result.debug ?? null);
      setListRawPreview(result.rawPreview ?? null);
      setExtractedWithKimi(result.extractedWithKimi ?? false);
      if (result.documents.length > 0) setSelectedId(result.documents[0].id);
    } else {
      setListError(result.error);
      addToast(result.error, "error");
    }
  }

  async function handleLoadTranscript() {
    if (!selectedId) return;
    setTranscriptError(null);
    setTranscript(null);
    setSynthesized(null);
    setSynthesizeError(null);
    setLoadingTranscript(true);
    const result = await getGranolaTranscriptForProject(selectedId);
    setLoadingTranscript(false);
    if (result.ok) {
      setTranscript({ title: result.title, content: result.content, created_at: result.created_at });
      setViewTab("summary");
    } else {
      setTranscriptError(result.error);
      addToast(result.error, "error");
    }
  }

  async function handleSynthesize() {
    if (!transcript) return;
    setSynthesizeError(null);
    setLoadingSynthesize(true);
    const result = await synthesizeGranolaTranscriptAction(transcript.title, transcript.content);
    setLoadingSynthesize(false);
    if (result.ok) {
      setSynthesized(result.content);
      setViewTab("summary");
    } else {
      setSynthesizeError(result.error);
      addToast(result.error, "error");
    }
  }

  async function handleImport(e: React.FormEvent) {
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
      synthesizedSummary: synthesized ?? undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      router.refresh();
      const parts: string[] = [];
      if (result.tasksCreated != null) parts.push(`${result.tasksCreated} task${result.tasksCreated === 1 ? "" : "s"}`);
      if (result.artifactId) parts.push("1 note");
      addToast(`Imported: ${parts.join(", ")}.`, "success");
      router.push(`/projects/${projectId}`);
    } else {
      addToast(result.error, "error");
    }
  }

  if (loadingTools) {
    return (
      <div style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--color-text-muted)" }}>
        Connecting to Granola…
      </div>
    );
  }

  if (connected === false) {
    return (
      <div
        style={{
          padding: "var(--space-8)",
          background: "var(--color-primary-muted)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          maxWidth: "28rem",
        }}
      >
        <h2 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-xl)", fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>
          Connect Granola first
        </h2>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          This app needs its own Granola connection to load your meetings. Connect once in Settings, then come back here.
        </p>
        <Link
          href={`/projects/${projectId}/settings#granola`}
          style={{
            display: "inline-block",
            marginTop: "var(--space-4)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-semibold)",
            color: "var(--color-accent)",
            textDecoration: "none",
          }}
        >
          Go to Settings → Granola MCP →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      {/* Step 1: Choose meeting */}
      <section
        style={{
          padding: "var(--space-6)",
          background: "var(--color-bg-elevated)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h2 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Choose meeting
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: "24rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-2)", color: "var(--color-text)" }}>
              List tool
            </label>
            <select
              value={selectedListTool}
              onChange={(e) => { setSelectedListTool(e.target.value); setListError(null); setListFetched(false); setListDebug(null); setListRawPreview(null); setExtractedWithKimi(false); }}
              style={{
                width: "100%",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                fontSize: "var(--text-sm)",
                backgroundColor: "var(--color-bg)",
              }}
            >
              {listTools.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-2)", color: "var(--color-text)" }}>
              Search (optional)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='e.g. "planning" or "with Sam"'
              style={{
                width: "100%",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                fontSize: "var(--text-sm)",
                backgroundColor: "var(--color-bg)",
              }}
            />
          </div>
          <Button type="button" variant="secondary" onClick={handleLoadMeetings} disabled={loadingList || !selectedListTool}>
            {loadingList ? "Loading…" : "Load meetings"}
          </Button>
          {listError && (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-error)" }}>{listError}</p>
          )}

          {listFetched && documents.length === 0 && !listError && (
            <div style={{ marginTop: "var(--space-4)" }}>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                No meetings found. Try a different list tool or search, or check{" "}
                <Link href={`/projects/${projectId}/settings#granola`} style={{ color: "var(--color-accent)", textDecoration: "none" }}>Settings → Granola MCP</Link>.
              </p>
              {listRawPreview && (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <button
                    type="button"
                    onClick={() => setShowRawResponse((v) => !v)}
                    style={{
                      padding: 0,
                      border: "none",
                      background: "none",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {showRawResponse ? "Hide" : "View"} raw response
                  </button>
                  {showRawResponse && (
                    <pre
                      style={{
                        margin: "var(--space-2) 0 0 0",
                        padding: "var(--space-3)",
                        fontSize: "11px",
                        lineHeight: 1.4,
                        background: "var(--color-bg)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border-subtle)",
                        maxHeight: 240,
                        overflow: "auto",
                        color: "var(--color-text-muted)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {listRawPreview.startsWith("{") || listRawPreview.startsWith("[") ? (() => {
                        try {
                          return JSON.stringify(JSON.parse(listRawPreview), null, 2);
                        } catch {
                          return listRawPreview;
                        }
                      })() : listRawPreview}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {documents.length > 0 && (
          <div style={{ marginTop: "var(--space-6)", maxWidth: "36rem" }}>
            <p style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {documents.length} meeting{documents.length === 1 ? "" : "s"}
              {extractedWithKimi ? " (from Kimi)" : ""} — select one to load its transcript.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              {documents.map((d, i) => {
                const isSelected = selectedId === d.id;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => { setSelectedId(d.id); setTranscript(null); setSynthesized(null); }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "var(--space-3) var(--space-4)",
                        border: "none",
                        borderBottom: i < documents.length - 1 ? "1px solid var(--color-border)" : "none",
                        background: isSelected ? "var(--color-bg-muted)" : "var(--color-bg)",
                        textAlign: "left",
                        cursor: "pointer",
                        font: "inherit",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text)",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <span style={{ display: "block", fontWeight: isSelected ? "var(--font-semibold)" : "var(--font-medium)" }}>
                        {d.title ?? d.id}
                      </span>
                      {d.title && d.id !== d.title && (
                        <span style={{ display: "block", marginTop: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {d.id}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Button
              type="button"
              variant="primary"
              onClick={handleLoadTranscript}
              disabled={loadingTranscript || !selectedId}
              style={{ marginTop: "var(--space-3)" }}
            >
              {loadingTranscript ? "Loading…" : "Load transcript"}
            </Button>
            {transcriptError && (
              <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>{transcriptError}</p>
            )}
          </div>
        )}
      </section>

      {/* Step 2: View & synthesize */}
      {transcript && (
        <section
          style={{
            padding: "var(--space-6)",
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>
              {transcript.title}
            </h2>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                type="button"
                onClick={() => setViewTab("summary")}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: viewTab === "summary" ? "var(--color-accent)" : "var(--color-text-muted)",
                  background: "none",
                  border: "none",
                  borderBottom: viewTab === "summary" ? "2px solid var(--color-accent)" : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                Summary
              </button>
              <button
                type="button"
                onClick={() => setViewTab("raw")}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                  color: viewTab === "raw" ? "var(--color-accent)" : "var(--color-text-muted)",
                  background: "none",
                  border: "none",
                  borderBottom: viewTab === "raw" ? "2px solid var(--color-accent)" : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                Raw transcript
              </button>
            </div>
          </div>

          {viewTab === "summary" && (
            <div>
              {!synthesized ? (
                <div>
                  <p style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    <strong>Kimi</strong> normalises the raw transcript into a structured summary: key points, decisions, and action items. The normalised summary is used when you import (for the note and for task extraction).
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSynthesize}
                    disabled={loadingSynthesize}
                  >
                    {loadingSynthesize ? "Synthesizing…" : "Synthesize with Kimi"}
                  </Button>
                  {synthesizeError && (
                    <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>{synthesizeError}</p>
                  )}
                </div>
              ) : (
                <div
                  className="prose"
                  style={{
                    fontSize: "var(--text-base)",
                    lineHeight: 1.7,
                    color: "var(--color-text)",
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {synthesized.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) {
                      return <h3 key={i} style={{ margin: "var(--space-6) 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)" }}>{line.slice(3)}</h3>;
                    }
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return <p key={i} style={{ margin: "var(--space-1) 0", fontWeight: "var(--font-medium)" }}>{line.slice(2, -2)}</p>;
                    }
                    if (line.startsWith("- ") || line.startsWith("* ")) {
                      return <li key={i} style={{ marginLeft: "var(--space-4)", marginBottom: "var(--space-1)" }}>{line.slice(2)}</li>;
                    }
                    if (line.trim() === "") return <br key={i} />;
                    return <p key={i} style={{ margin: "var(--space-2) 0" }}>{line}</p>;
                  })}
                </div>
              )}
            </div>
          )}

          {viewTab === "raw" && (
            <div
              style={{
                padding: "var(--space-4)",
                background: "var(--color-bg-muted)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                maxHeight: "24rem",
                overflow: "auto",
                color: "var(--color-text-muted)",
              }}
            >
              {transcript.content}
            </div>
          )}
        </section>
      )}

      {/* Step 3: Add to project */}
      {transcript && (
        <section
          style={{
            padding: "var(--space-6)",
            background: "var(--color-bg-elevated)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Add to {projectName}
          </h2>
          {synthesized && (
            <p style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              The summary above will be saved as the note and used to extract action items for tasks.
            </p>
          )}
          <form onSubmit={handleImport} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", cursor: "pointer" }}>
              <input type="checkbox" checked={createTasks} onChange={(e) => setCreateTasks(e.target.checked)} />
              Create tasks from action items
            </label>
            {createTasks && (
              <div style={{ marginLeft: "var(--space-6)" }}>
                <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: "var(--space-1)" }}>Due</label>
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
                  <option value="week">End of week</option>
                </select>
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", cursor: "pointer" }}>
              <input type="checkbox" checked={createNote} onChange={(e) => setCreateNote(e.target.checked)} />
              Save as meeting note
            </label>
            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
              <Button type="submit" disabled={submitting || (!createTasks && !createNote)}>
                {submitting ? "Importing…" : "Import"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push(`/projects/${projectId}`)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
