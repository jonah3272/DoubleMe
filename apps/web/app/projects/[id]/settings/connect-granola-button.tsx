"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, useToast } from "@/components/ui";
import { getGranolaConnectUrl, resetGranolaConnectionAction } from "../granola-actions";

export function ConnectGranolaButton({ connected }: { connected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const handleConnect = async () => {
    setLoading(true);
    const result = await getGranolaConnectUrl();
    setLoading(false);
    if (result.ok) {
      window.location.href = result.url;
    } else {
      addToast(result.error, "error");
      router.refresh();
    }
  };

  const handleReset = async () => {
    setResetting(true);
    const result = await resetGranolaConnectionAction();
    setResetting(false);
    if (result.ok) {
      addToast("Granola connection reset. You can connect again as if for the first time.", "success");
      router.refresh();
    } else {
      addToast(result.error, "error");
    }
  };

  if (connected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-success, #16a34a)", fontWeight: "var(--font-medium)" }}>
          Your account is connected. Use &quot;From Granola&quot; or &quot;Import from Granola&quot; to pull in transcripts.
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: resetting ? "wait" : "pointer",
            textDecoration: "underline",
            alignSelf: "flex-start",
          }}
        >
          {resetting ? "Resetting…" : "Reset connection (start over)"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
        Connect your Granola account to import meeting transcripts here — same flow as in Claude or ChatGPT.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Button onClick={handleConnect} disabled={loading} type="button">
          {loading ? "Opening…" : "Connect to Granola"}
        </Button>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: resetting ? "wait" : "pointer",
            textDecoration: "underline",
          }}
        >
          {resetting ? "Resetting…" : "Reset and try again"}
        </button>
      </div>
    </div>
  );
}
