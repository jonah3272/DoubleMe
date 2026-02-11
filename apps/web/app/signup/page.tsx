"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUserNoEmail } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const result = await createUserNoEmail(email.trim(), password);
    if (!result?.ok) {
      setLoading(false);
      setMessage({ type: "error", text: result?.error ?? "Signup failed." });
      return;
    }
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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
            onSubmit={handleSubmit}
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
              {loading ? "Please wait…" : "Create account"}
            </Button>
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
