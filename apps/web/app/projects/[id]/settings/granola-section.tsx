import Link from "next/link";
import { ConnectGranolaButton } from "./connect-granola-button";

const MCP_URL = "https://mcp.granola.ai";
const MCP_ENDPOINT = "https://mcp.granola.ai/mcp";

export function GranolaSection({ configured, connected }: { configured: boolean; connected?: boolean }) {
  return (
    <section
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
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
        Import tasks and meeting notes from Granola transcripts. This app connects to the Granola MCP server to list and fetch your meeting data.
      </p>

      <ConnectGranolaButton connected={connected ?? false} />

      <div
        style={{
          padding: "var(--space-3)",
          background: "var(--color-surface-elevated)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--color-text)" }}>Official MCP (mcp.granola.ai)</strong>
        <ul style={{ margin: "var(--space-2) 0 0 0", paddingLeft: "var(--space-4)" }}>
          <li>Uses <strong>OAuth 2.0</strong> — your AI tool must open a browser so you can sign in to Granola.</li>
          <li>Each user authenticates individually; there is <strong>no API key or service account</strong>.</li>
          <li>After sign-in, the tool receives a bearer token to send with each request.</li>
        </ul>
        <p style={{ margin: "var(--space-2) 0 0 0" }}>
          Your tool must support: <strong>MCP client protocol</strong> with <strong>Streamable HTTP transport</strong> and <strong>browser-based OAuth</strong>.
        </p>
      </div>

      <div
        style={{
          padding: "var(--space-3)",
          background: "var(--color-surface-elevated)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--color-text)" }}>Local Granola (proofgeist)</strong>
        <p style={{ margin: "var(--space-2) 0 0 0" }}>
          For <strong>100% local</strong> meeting data (macOS Granola cache, no cloud), use{" "}
          <a
            href="https://github.com/proofgeist/granola-ai-mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-primary)", textDecoration: "none" }}
          >
            proofgeist/granola-ai-mcp-server
          </a>
          . It exposes <code style={{ fontSize: "0.9em", padding: "0 2px", background: "var(--color-bg-muted)", borderRadius: "var(--radius-sm)" }}>search_meetings</code>,{" "}
          <code style={{ fontSize: "0.9em", padding: "0 2px", background: "var(--color-bg-muted)", borderRadius: "var(--radius-sm)" }}>get_meeting_transcript</code>, etc. from your local cache. No OAuth.
        </p>
        <p style={{ margin: "var(--space-2) 0 0 0", fontWeight: "var(--font-medium)", color: "var(--color-text)" }}>To use it with this app:</p>
        <ol style={{ margin: "var(--space-2) 0 0 0", paddingLeft: "var(--space-4)" }}>
          <li>Clone the repo, run <code style={{ fontSize: "0.85em", padding: "0 2px", background: "var(--color-bg-muted)", borderRadius: "var(--radius-sm)" }}>uv sync</code>, and ensure the Granola cache exists (e.g. <code style={{ fontSize: "0.85em", padding: "0 2px", background: "var(--color-bg-muted)", borderRadius: "var(--radius-sm)" }}>~/Library/Application Support/Granola/cache-v3.json</code> on macOS).</li>
          <li>Run the HTTP bridge: <code style={{ fontSize: "0.85em", padding: "0 2px", background: "var(--color-bg-muted)", borderRadius: "var(--radius-sm)" }}>GRANOLA_MCP_SERVER_CMD=/path/to/granola-ai-mcp-server/.venv/bin/granola-mcp-server node apps/web/scripts/granola-http-bridge.mjs</code></li>
          <li>Set <code style={{ fontSize: "0.85em", padding: "0 2px", background: "var(--color-bg-muted)", borderRadius: "var(--radius-sm)" }}>GRANOLA_MCP_URL=http://localhost:3333</code> (or your <code style={{ fontSize: "0.85em", padding: "0 2px", background: "var(--color-bg-muted)", borderRadius: "var(--radius-sm)" }}>PORT</code>) in <code style={{ fontSize: "0.85em", padding: "0 2px", background: "var(--color-bg-muted)", borderRadius: "var(--radius-sm)" }}>.env.local</code>. The app will talk to the bridge; no &quot;Connect to Granola&quot; needed for local.</li>
        </ol>
      </div>

      <div>
        <p style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--color-text)" }}>
          Other AI tools — manual connection
        </p>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          You can connect to the Granola MCP manually using the public URL as a custom connection:
        </p>
        <code
          style={{
            display: "block",
            marginTop: "var(--space-2)",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--text-xs)",
            background: "var(--color-bg-muted)",
            borderRadius: "var(--radius-sm)",
            wordBreak: "break-all",
          }}
        >
          {MCP_ENDPOINT}
        </code>
      </div>

      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
        In this app, &quot;From Granola&quot; and &quot;Import from Granola&quot; use the same endpoint. If you have a <strong>bearer token</strong> (e.g. from another tool after OAuth), you can set <code style={{ fontSize: "0.9em", padding: "0 2px", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-sm)" }}>GRANOLA_API_TOKEN</code> in <code style={{ fontSize: "0.9em", padding: "0 2px", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-sm)" }}>.env.local</code> so server-side requests use it; otherwise configure your AI tool to use the URL above with its OAuth flow.
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
