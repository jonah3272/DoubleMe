"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";
const THEMES = ["light", "dark"] as const;

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    const preferred = stored ?? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      style={{
        padding: "var(--space-2) var(--space-3)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-medium)",
        color: "var(--color-text-muted)",
        background: "none",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
      }}
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
