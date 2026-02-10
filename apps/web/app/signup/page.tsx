"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { confirmUserEmail } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      setMessage({ type: "error", text: error.message });
      return;
    }
    if (data.user?.id) {
      await confirmUserEmail(data.user.id);
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (!signInError) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setMessage({ type: "success", text: "Account created. Sign in with your password." });
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
            Sign up
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
                  minLength={6}
                  autoComplete="new-password"
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
              {loading ? "Please wait…" : mode === "magic" ? "Send magic link" : "Create account"}
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
              {mode === "magic" ? "Sign up with password instead" : "Use magic link instead"}
            </button>
          </form>
          <p style={{ marginTop: "var(--space-6)", marginBottom: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--color-text)", fontWeight: "var(--font-medium)" }}>
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
