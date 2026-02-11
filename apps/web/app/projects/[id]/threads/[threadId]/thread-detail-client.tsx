"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, useToast } from "@/components/ui";
import { addMessage } from "../actions";

export type MessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export function ThreadDetailClient({
  projectId,
  threadId,
  initialMessages,
}: {
  projectId: string;
  threadId: string;
  initialMessages: MessageRow[];
}) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSubmitting(true);
    const result = await addMessage(projectId, threadId, "user", text);
    setSubmitting(false);
    if (result.ok) {
      setContent("");
      router.refresh();
      addToast("Message added.", "success");
    } else {
      addToast(result.error, "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <Link href={`/projects/${projectId}/threads`} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}>
        ← Threads
      </Link>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {messages.length === 0 ? (
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>No messages yet. Add one below.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                padding: "var(--space-4)",
                borderRadius: "var(--radius-lg)",
                backgroundColor: m.role === "user" ? "var(--color-surface-elevated)" : "var(--color-bg-muted)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                {m.role}
              </span>
              <p style={{ margin: "var(--space-2) 0 0 0", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>{m.content}</p>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <label htmlFor="message" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>
          Add message
        </label>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Input
            id="message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message…"
            disabled={submitting}
          />
          <Button type="submit" disabled={submitting || !content.trim()}>
            {submitting ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
