"use client";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  style,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={className}
      style={{
        padding: "var(--space-16) var(--space-8)",
        textAlign: "center",
        ...style,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-lg)",
          fontWeight: "var(--font-medium)",
          color: "var(--color-text)",
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            margin: "var(--space-2) 0 0 0",
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            maxWidth: 360,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div
          style={{
            marginTop: "var(--space-6)",
          }}
        >
          {action}
        </div>
      )}
    </div>
  );
}
