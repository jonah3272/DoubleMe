import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui";

export default function ProjectLoading() {
  return (
    <AppShell>
      <div style={{ padding: "var(--space-8)", maxWidth: "56rem" }}>
        <Skeleton style={{ height: 32, width: 240, marginBottom: "var(--space-2)" }} />
        <Skeleton style={{ height: 20, width: "80%", marginBottom: "var(--space-8)" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} style={{ height: 160, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
