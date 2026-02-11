"use client";

import { useState } from "react";
import { Button, Card, CardContent, useToast } from "@/components/ui";
import { PROJECT_TOOLS, type ProjectTool } from "@/lib/project-tools";
import { enableProjectTool, disableProjectTool } from "../actions";

type Props = {
  projectId: string;
  enabledAgentKeys: string[];
};

export function ProjectTools({ projectId, enabledAgentKeys }: Props) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(enabledAgentKeys));
  const [loading, setLoading] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleEnable = async (tool: ProjectTool) => {
    if (tool.comingSoon) return;
    setLoading(tool.agentKey);
    const result = await enableProjectTool(projectId, tool.agentKey);
    setLoading(null);
    if (result.ok) {
      setEnabled((prev) => new Set([...prev, tool.agentKey]));
      addToast(`${tool.name} enabled.`, "success");
    } else {
      addToast(result.error, "error");
    }
  };

  const handleDisable = async (tool: ProjectTool) => {
    setLoading(tool.agentKey);
    const result = await disableProjectTool(projectId, tool.agentKey);
    setLoading(null);
    if (result.ok) {
      setEnabled((prev) => {
        const next = new Set(prev);
        next.delete(tool.agentKey);
        return next;
      });
      addToast(`${tool.name} disabled.`, "success");
    } else {
      addToast(result.error, "error");
    }
  };

  const isEnabled = (agentKey: string) => enabled.has(agentKey);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-semibold)",
          color: "var(--color-text)",
        }}
      >
        Tools
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-sm)",
          color: "var(--color-text-muted)",
          maxWidth: "42rem",
        }}
      >
        Enable tools and integrations for this project. Calendar, meeting notes, and Figma will be available as we add them.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        {PROJECT_TOOLS.map((tool) => (
          <Card key={tool.id} variant="outlined">
            <CardContent style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
                <span style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-base)" }}>
                  {tool.name}
                </span>
                {tool.badge && (
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: "var(--text-xs)",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--color-surface-elevated)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {tool.badge}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                {tool.description}
              </p>
              <div style={{ marginTop: "var(--space-2)" }}>
                {tool.comingSoon ? (
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-subtle)" }}>
                    Coming soon
                  </span>
                ) : isEnabled(tool.agentKey) ? (
                  <Button
                    variant="secondary"
                    onClick={() => handleDisable(tool)}
                    disabled={loading === tool.agentKey}
                  >
                    {loading === tool.agentKey ? "Updating…" : "Disable"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleEnable(tool)}
                    disabled={loading === tool.agentKey}
                  >
                    {loading === tool.agentKey ? "Enabling…" : "Enable"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
