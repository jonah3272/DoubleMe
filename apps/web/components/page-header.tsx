"use client";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  style,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={className}
      style={{
        padding: "var(--space-8) var(--space-8) var(--space-6)",
        borderBottom: "1px solid var(--color-border-subtle)",
        backgroundColor: "var(--color-bg-elevated)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--text-2xl)",
              fontWeight: "var(--font-semibold)",
              color: "var(--color-text)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                margin: "var(--space-1) 0 0 0",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ flexShrink: 0 }}>{actions}</div>
        )}
      </div>
    </header>
  );
}
