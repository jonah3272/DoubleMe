"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, EmptyState, useToast } from "@/components/ui";
import { createConversation } from "./actions";

export type ConversationRow = {
  id: string;
  title: string | null;
  updated_at: string;
};

export function ThreadsListClient({
  projectId,
  initialConversations,
}: {
  projectId: string;
  initialConversations: ConversationRow[];
}) {
  const [conversations, setConversations] = useState<ConversationRow[]>(initialConversations);
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const handleNewThread = async () => {
    setCreating(true);
    const result = await createConversation(projectId);
    setCreating(false);
    if (result.ok) {
      setConversations((prev) => [...prev, { id: result.id, title: null, updated_at: new Date().toISOString() }]);
      router.refresh();
      router.push(`/projects/${projectId}/threads/${result.id}`);
    } else {
      addToast(result.error, "error");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <Link href={`/projects/${projectId}`} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}>
          ← Overview
        </Link>
        <Button onClick={handleNewThread} disabled={creating}>
          {creating ? "Creating…" : "New thread"}
        </Button>
      </div>
      {conversations.length === 0 ? (
        <EmptyState
          title="No threads yet"
          description="Start a conversation to capture notes and decisions."
          action={<Button onClick={handleNewThread} disabled={creating}>New thread</Button>}
        />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/projects/${projectId}/threads/${c.id}`}
                style={{
                  display: "block",
                  padding: "var(--space-4)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span style={{ fontWeight: "var(--font-medium)" }}>{c.title || `Thread ${formatDate(c.updated_at)}`}</span>
                <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  {formatDate(c.updated_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
