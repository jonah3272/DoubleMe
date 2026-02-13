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
  askKimiAboutTranscriptAction,
  importFromGranolaIntoProject,
  getActionItemsWithSuggestedAssignees,
  type GranolaDocument,
  type ActionItemWithSuggestedAssignee,
  type ContactOption,
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
  const [listFilter, setListFilter] = useState("");
  const [dateRange, setDateRange] = useState<"today" | "week" | "all">("today");
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

  const [taskPreviewItems, setTaskPreviewItems] = useState<ActionItemWithSuggestedAssignee[] | null>(null);
  const [taskPreviewContacts, setTaskPreviewContacts] = useState<ContactOption[]>([]);
  const [taskPreviewAssignees, setTaskPreviewAssignees] = useState<(string | null)[]>([]);
  const [loadingTaskPreview, setLoadingTaskPreview] = useState(false);

  const [kimiQuery, setKimiQuery] = useState("");
  const [kimiResponse, setKimiResponse] = useState<string | null>(null);
  const [loadingKimi, setLoadingKimi] = useState(false);
  const [kimiError, setKimiError] = useState<string | null>(null);

  useEffect(() => {
    setTaskPreviewItems(null);
    setTaskPreviewContacts([]);
    setTaskPreviewAssignees([]);
  }, [synthesized]);

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

  function filterByDateRange(docs: GranolaDocument[], range: "today" | "week" | "all"): GranolaDocument[] {
    if (range === "all") return docs;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return docs.filter((d) => {
      const raw = d.created_at;
      if (!raw) return range === "all";
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return range === "all";
      if (range === "today") return date >= todayStart && date <= todayEnd;
      return date >= weekStart && date <= now;
    });
  }

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
      const byDate = filterByDateRange(result.documents, dateRange);
      const first = byDate[0] ?? result.documents[0];
      if (first) setSelectedId(first.id);
    } else {
      setListError(result.error);
      addToast(result.error, "error");
    }
  }

  async function handleLoadTranscript() {
    const id = selectedId;
    if (!id) return;
    setTranscriptError(null);
    setTranscript(null);
    setSynthesized(null);
    setSynthesizeError(null);
    setKimiQuery("");
    setKimiResponse(null);
    setKimiError(null);
    setLoadingTranscript(true);
    const result = await getGranolaTranscriptForProject(id);
    setLoadingTranscript(false);
    if (result.ok) {
      setTranscript({ title: result.title, content: result.content, created_at: result.created_at });
      setViewTab("summary");
    } else {
      setTranscriptError(result.error);
      addToast(result.error, "error");
    }
  }

  /** Click a meeting: load transcript and run Kimi summary, then show on page. */
  async function handleSelectMeeting(documentId: string) {
    setSelectedId(documentId);
    setTranscriptError(null);
    setTranscript(null);
    setSynthesized(null);
    setSynthesizeError(null);
    setKimiQuery("");
    setKimiResponse(null);
    setKimiError(null);
    setLoadingTranscript(true);
    const transcriptResult = await getGranolaTranscriptForProject(documentId);
    setLoadingTranscript(false);
    if (!transcriptResult.ok) {
      setTranscriptError(transcriptResult.error);
      addToast(transcriptResult.error, "error");
      return;
    }
    setTranscript({
      title: transcriptResult.title,
      content: transcriptResult.content,
      created_at: transcriptResult.created_at,
    });
    setViewTab("summary");
    setLoadingSynthesize(true);
    const synResult = await synthesizeGranolaTranscriptAction(
      transcriptResult.title,
      transcriptResult.content
    );
    setLoadingSynthesize(false);
    if (synResult.ok) {
      setSynthesized(synResult.content);
    } else {
      setSynthesizeError(synResult.error);
      addToast(synResult.error, "error");
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

  async function handleAskKimi(e: React.FormEvent) {
    e.preventDefault();
    if (!transcript || !kimiQuery.trim()) return;
    setKimiError(null);
    setLoadingKimi(true);
    const result = await askKimiAboutTranscriptAction(transcript.title, transcript.content, kimiQuery.trim());
    setLoadingKimi(false);
    if (result.ok) {
      setKimiResponse(result.content);
    } else {
      setKimiError(result.error);
      addToast(result.error, "error");
    }
  }

  async function loadTaskPreview() {
    if (!synthesized?.trim()) return;
    setLoadingTaskPreview(true);
    const result = await getActionItemsWithSuggestedAssignees(projectId, synthesized);
    setLoadingTaskPreview(false);
    if (result.ok) {
      setTaskPreviewItems(result.items);
      setTaskPreviewContacts(result.contacts);
      setTaskPreviewAssignees(result.items.map((i) => i.suggested_assignee_id));
    } else {
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
    const taskItems =
      createTasks && taskPreviewItems && taskPreviewItems.length > 0
        ? taskPreviewItems.map((item, i) => ({
            title: item.title,
            assignee_id: taskPreviewAssignees[i] ?? item.suggested_assignee_id,
          }))
        : undefined;
    const result = await importFromGranolaIntoProject(projectId, selectedId, {
      createTasks,
      createNote,
      taskDueAt: createTasks ? taskDueAt : undefined,
      synthesizedSummary: synthesized ?? undefined,
      taskItems,
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

        {documents.length > 0 && (() => {
            const dateFiltered = filterByDateRange(documents, dateRange);
            const q = listFilter.trim().toLowerCase();
            const filtered = q
              ? dateFiltered.filter(
                  (d) =>
                    (d.title ?? "").toLowerCase().includes(q) ||
                    (d.id ?? "").toLowerCase().includes(q) ||
                    (d.created_at ?? "").toLowerCase().includes(q)
                )
              : dateFiltered;
            return (
          <div style={{ marginTop: "var(--space-6)", maxWidth: "36rem" }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--color-text-muted)" }}>When:</span>
              <div
                role="tablist"
                style={{
                  display: "inline-flex",
                  padding: 2,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-muted)",
                }}
              >
                {(["today", "week", "all"] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    role="tab"
                    aria-selected={dateRange === range}
                    onClick={() => setDateRange(range)}
                    style={{
                      padding: "var(--space-1) var(--space-3)",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--font-medium)",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      background: dateRange === range ? "var(--color-bg-elevated)" : "transparent",
                      color: dateRange === range ? "var(--color-text)" : "var(--color-text-muted)",
                      boxShadow: dateRange === range ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    {range === "today" ? "Today" : range === "week" ? "This week" : "All"}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                {filtered.length === dateFiltered.length
                  ? `${dateFiltered.length} of ${documents.length}`
                  : `${filtered.length} of ${dateFiltered.length}`}
              </span>
            </div>
            <p style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {extractedWithKimi ? "From Kimi. " : ""}Click a meeting to load its summary.
            </p>
            {(documents.length > 4 || listFilter) && (
              <input
                type="text"
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                placeholder="Search by title, date, or id…"
                style={{
                  width: "100%",
                  marginBottom: "var(--space-3)",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-sm)",
                  backgroundColor: "var(--color-bg)",
                }}
              />
            )}
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                maxHeight: "min(320px, 50vh)",
                overflowY: "auto",
              }}
            >
              {filtered.map((d, i) => {
                const isSelected = selectedId === d.id;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectMeeting(d.id)}
                      disabled={loadingTranscript}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "var(--space-3) var(--space-4)",
                        border: "none",
                        borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                        background: isSelected ? "var(--color-bg-muted)" : "var(--color-bg)",
                        textAlign: "left",
                        cursor: loadingTranscript ? "wait" : "pointer",
                        font: "inherit",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text)",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <span style={{ display: "block", fontWeight: isSelected ? "var(--font-semibold)" : "var(--font-medium)" }}>
                        {d.title ?? d.id}
                      </span>
                      {d.created_at && (
                        <span style={{ display: "block", marginTop: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {d.created_at}
                        </span>
                      )}
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
            );
          })()}
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

          <div style={{ marginTop: "var(--space-6)", paddingTop: "var(--space-6)", borderTop: "1px solid var(--color-border)" }}>
            <h3 style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>
              Talk to Kimi
            </h3>
            <p style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Ask a question about this transcript. Kimi will answer using only the loaded data.
            </p>
            <form onSubmit={handleAskKimi} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <textarea
                value={kimiQuery}
                onChange={(e) => setKimiQuery(e.target.value)}
                placeholder="e.g. What were the action items? Summarise for the client."
                rows={3}
                disabled={loadingKimi}
                style={{
                  width: "100%",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-sm)",
                  fontFamily: "inherit",
                  resize: "vertical",
                  backgroundColor: "var(--color-bg)",
                }}
              />
              <Button type="submit" variant="secondary" disabled={loadingKimi || !kimiQuery.trim()}>
                {loadingKimi ? "Asking…" : "Ask Kimi"}
              </Button>
            </form>
            {kimiError && (
              <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-sm)", color: "var(--color-error)" }}>{kimiError}</p>
            )}
            {kimiResponse && (
              <div
                style={{
                  marginTop: "var(--space-3)",
                  padding: "var(--space-4)",
                  background: "var(--color-bg-muted)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-sm)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  color: "var(--color-text)",
                }}
              >
                {kimiResponse}
              </div>
            )}
          </div>
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
              <div style={{ marginLeft: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div>
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
                {synthesized?.trim() && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={loadTaskPreview}
                      disabled={loadingTaskPreview}
                    >
                      {loadingTaskPreview ? "Loading…" : taskPreviewItems ? "Refresh assignees" : "Preview tasks & assignees"}
                    </Button>
                    {taskPreviewItems && taskPreviewItems.length > 0 && (
                      <div style={{ marginTop: "var(--space-2)" }}>
                        <p style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          Assign each task; suggested from meeting. Override as needed.
                        </p>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", maxHeight: "min(240px, 40vh)", overflowY: "auto" }}>
                          {taskPreviewItems.map((item, i) => (
                            <li
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-3)",
                                padding: "var(--space-2) var(--space-3)",
                                borderBottom: i < taskPreviewItems.length - 1 ? "1px solid var(--color-border)" : "none",
                                background: "var(--color-bg)",
                              }}
                            >
                              <span style={{ flex: 1, fontSize: "var(--text-sm)", minWidth: 0 }} title={item.title}>
                                {item.title.slice(0, 60)}{item.title.length > 60 ? "…" : ""}
                              </span>
                              <select
                                value={taskPreviewAssignees[i] ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setTaskPreviewAssignees((prev) => {
                                    const next = [...prev];
                                    next[i] = v || null;
                                    return next;
                                  });
                                }}
                                style={{
                                  padding: "var(--space-1) var(--space-2)",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--color-border)",
                                  fontSize: "var(--text-xs)",
                                  backgroundColor: "var(--color-bg)",
                                  minWidth: "8rem",
                                }}
                              >
                                <option value="">No assignee</option>
                                {taskPreviewContacts.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {taskPreviewItems && taskPreviewItems.length === 0 && (
                      <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        No action items found in the summary.
                      </p>
                    )}
                  </>
                )}
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
