import Link from "next/link";

const MCP_URL = "https://mcp.granola.ai";

export function GranolaSection({ configured }: { configured: boolean }) {
  return (
    <section
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)", color: "var(--color-text)" }}>
          Granola MCP
        </h2>
        <span
          style={{
            fontSize: "var(--text-xs)",
            padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: configured ? "var(--color-success-subtle, rgba(34, 197, 94, 0.12))" : "var(--color-surface-elevated)",
            color: configured ? "var(--color-success, #16a34a)" : "var(--color-text-muted)",
          }}
        >
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
        Import tasks from meeting transcripts via Granola MCP. The app uses <strong>https://mcp.granola.ai/mcp</strong> by default. Override with <code style={{ fontSize: "0.9em", padding: "0 2px", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-sm)" }}>GRANOLA_MCP_URL</code> and add{" "}
        <code style={{ fontSize: "0.9em", padding: "0 2px", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-sm)" }}>GRANOLA_API_TOKEN</code> in <code style={{ fontSize: "0.9em", padding: "0 2px", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-sm)" }}>.env.local</code> if the server requires auth. Use &quot;Import from Granola&quot; on the Tasks page.
      </p>
      <Link
        href={MCP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", textDecoration: "none" }}
      >
        {MCP_URL} →
      </Link>
    </section>
  );
}
