"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";

const motionProps = {
  whileTap: { opacity: 0.92 },
  transition: { duration: 0.15 },
};

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-2)",
  fontWeight: "var(--font-medium)",
  borderRadius: "var(--radius-lg)",
  transition: "background-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)",
  cursor: "pointer",
  border: "1px solid transparent",
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--color-primary)",
    color: "var(--color-inverse)",
    borderColor: "var(--color-primary)",
  },
  secondary: {
    backgroundColor: "var(--color-bg-elevated)",
    color: "var(--color-text)",
    borderColor: "var(--color-border)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--color-text)",
  },
  danger: {
    backgroundColor: "var(--color-error)",
    color: "var(--color-inverse)",
    borderColor: "var(--color-error)",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { minHeight: 32, padding: "0 var(--space-3)", fontSize: "var(--text-sm)" },
  md: { minHeight: 40, padding: "0 var(--space-4)", fontSize: "var(--text-sm)" },
  lg: { minHeight: 48, padding: "0 var(--space-5)", fontSize: "var(--text-base)" },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      className = "",
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        className={className}
        disabled={disabled}
        className={`ui-button ${className}`.trim()}
        style={{
          ...baseStyle,
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...(fullWidth ? { width: "100%" } : {}),
          ...style,
        }}
        {...motionProps}
        {...props}
      >
        {props.children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
