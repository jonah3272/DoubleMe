"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("Jonahrehbeinjones@gmail.com");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("password");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Check your email for the sign-in link." });
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8)",
        background: "var(--color-bg)",
      }}
    >
      <Card
        variant="elevated"
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <CardHeader style={{ padding: "var(--space-8) var(--space-8) var(--space-6)" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--text-2xl)",
              fontWeight: "var(--font-semibold)",
              letterSpacing: "var(--tracking-tight)",
              color: "var(--color-text)",
            }}
          >
            Sign in
          </h1>
        </CardHeader>
        <CardContent style={{ padding: "0 var(--space-8) var(--space-8)" }}>
          <form
            onSubmit={mode === "magic" ? handleMagicLink : handlePassword}
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
          >
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  marginBottom: "var(--space-2)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-medium)",
                }}
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-label="Email"
              />
            </div>
            {mode === "password" && (
              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    marginBottom: "var(--space-2)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-medium)",
                  }}
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                />
              </div>
            )}
            {message && (
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-sm)",
                  color: message.type === "error" ? "var(--color-error)" : "var(--color-success)",
                }}
              >
                {message.text}
              </p>
            )}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Please wait…" : mode === "magic" ? "Send magic link" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "magic" ? "password" : "magic");
                setMessage(null);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {mode === "magic" ? "Sign in with password instead" : "Use magic link instead"}
            </button>
          </form>
          <p style={{ marginTop: "var(--space-6)", marginBottom: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            No account?{" "}
            <Link href="/signup" style={{ color: "var(--color-text)", fontWeight: "var(--font-medium)" }}>
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
