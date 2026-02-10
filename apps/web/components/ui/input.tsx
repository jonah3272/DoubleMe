"use client";

import { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const baseStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 40,
  padding: "0 var(--space-4)",
  fontSize: "var(--text-base)",
  lineHeight: "var(--leading-normal)",
  color: "var(--color-text)",
  backgroundColor: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  transition: "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`ui-input ${className}`.trim()}
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

Input.displayName = "Input";
