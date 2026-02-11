"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message || "An unexpected error occurred.";
  const isEnvError = /missing|env|\.env|supabase|required environment/i.test(message);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <h1 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)" }}>
        Something went wrong
      </h1>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textAlign: "center", maxWidth: 400 }}>
        {message}
      </p>
      {isEnvError && (
        <p style={{ margin: "var(--space-3) 0 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-subtle)", textAlign: "center", maxWidth: 400 }}>
          Copy <code style={{ background: "var(--color-bg-muted)", padding: "2px 6px", borderRadius: 4 }}>apps/web/.env.local.example</code> to{" "}
          <code style={{ background: "var(--color-bg-muted)", padding: "2px 6px", borderRadius: 4 }}>.env.local</code> and set your Supabase URL and keys.
        </p>
      )}
      <div style={{ marginTop: "var(--space-6)", display: "flex", gap: "var(--space-3)" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "var(--space-2) var(--space-4)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            color: "var(--color-inverse)",
            backgroundColor: "var(--color-primary)",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: "var(--space-2) var(--space-4)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            color: "var(--color-text)",
            backgroundColor: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
