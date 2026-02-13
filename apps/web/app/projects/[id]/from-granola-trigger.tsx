"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/**
 * Entry point for "From Granola" – navigates to the full Import from Granola page
 * where users can pick a meeting, view/synthesize the transcript, and import tasks + note.
 */
export function FromGranolaTrigger({
  projectId,
  variant = "button",
  className,
}: {
  projectId: string;
  variant?: "button" | "link";
  className?: string;
}) {
  const href = `/projects/${projectId}/import/granola`;
  const router = useRouter();
  if (variant === "link") {
    return (
      <Link
        href={href}
        className={className}
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
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        From Granola →
      </Link>
    );
  }
  return (
    <Button variant="secondary" type="button" onClick={() => router.push(href)}>
      From Granola
    </Button>
  );
}
