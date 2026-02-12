"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, useToast } from "@/components/ui";
import { getGranolaConnectUrl } from "../granola-actions";

export function ConnectGranolaButton({ connected }: { connected: boolean }) {
  const [loading, setLoading] = useState(false);
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

  if (connected) {
    return (
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-success, #16a34a)", fontWeight: "var(--font-medium)" }}>
        Your account is connected. Use &quot;From Granola&quot; or &quot;Import from Granola&quot; to pull in transcripts.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
        Connect your Granola account to import meeting transcripts here — same flow as in Claude or ChatGPT.
      </p>
      <Button onClick={handleConnect} disabled={loading} type="button">
        {loading ? "Opening…" : "Connect to Granola"}
      </Button>
    </div>
  );
}
