"use client";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  width,
  height = 20,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`skeleton-pulse ${className}`.trim()}
      style={{
        width: width ?? "100%",
        height: typeof height === "number" ? `${height}px` : height,
        backgroundColor: "var(--color-bg-muted)",
        borderRadius: "var(--radius-sm)",
        ...style,
      }}
      {...props}
    />
  );
}
