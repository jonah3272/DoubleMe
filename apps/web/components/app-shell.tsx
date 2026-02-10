"use client";

export interface AppShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function AppShell({ children, sidebar, style, className = "" }: AppShellProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        ...style,
      }}
    >
      {sidebar && (
        <aside
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg-elevated)",
          }}
        >
          {sidebar}
        </aside>
      )}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>
    </div>
  );
}
