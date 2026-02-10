"use client";

import { forwardRef } from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const baseStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 120,
  padding: "var(--space-3) var(--space-4)",
  fontSize: "var(--text-base)",
  lineHeight: "var(--leading-normal)",
  color: "var(--color-text)",
  backgroundColor: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  resize: "vertical",
  transition:
    "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", style, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`ui-textarea ${className}`.trim()}
        style={{
          ...baseStyle,
          ...(error
            ? {
                borderColor: "var(--color-error)",
                boxShadow: "0 0 0 1px var(--color-error)",
              }
            : {}),
          ...style,
        }}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
