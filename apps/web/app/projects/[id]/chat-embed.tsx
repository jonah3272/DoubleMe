"use client";

const CHATGPT_URL = "https://chat.openai.com";

export function ChatEmbed() {
  return (
    <div
      id="chat"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "var(--text-lg)",
            fontWeight: "var(--font-semibold)",
            color: "var(--color-text)",
          }}
        >
          ChatGPT
        </h2>
        <a
          href={CHATGPT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            color: "var(--color-primary)",
            textDecoration: "none",
          }}
        >
          Open in new tab →
        </a>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
        }}
      >
        Use your own ChatGPT Plus account. If the chat doesn’t load below (some browsers block it), use the link above.
      </p>
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: 480,
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          backgroundColor: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        <iframe
          src={CHATGPT_URL}
          title="ChatGPT"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
            minHeight: 480,
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
