"use client";

import { forwardRef } from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "outlined" | "muted";
}

const variantStyles: Record<CardProps["variant"] & string, React.CSSProperties> = {
  elevated: {
    backgroundColor: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border-subtle)",
    boxShadow: "var(--shadow-md)",
  },
  outlined: {
    backgroundColor: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
  },
  muted: {
    backgroundColor: "var(--color-bg-muted)",
    border: "1px solid transparent",
  },
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "elevated", className = "", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          borderRadius: "var(--radius-lg)",
          ...variantStyles[variant],
          ...style,
        }}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          padding: "var(--space-6)",
          borderBottom: "1px solid var(--color-border-subtle)",
          ...style,
        }}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          padding: "var(--space-6)",
          ...style,
        }}
        {...props}
      />
    );
  }
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          padding: "var(--space-4) var(--space-6)",
          borderTop: "1px solid var(--color-border-subtle)",
          ...style,
        }}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";
