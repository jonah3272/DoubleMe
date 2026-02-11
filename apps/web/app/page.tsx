import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8)",
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,0,0,0.04), transparent)",
      }}
    >
      <div
        style={{
          maxWidth: "36rem",
          textAlign: "center",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 5vw, var(--text-5xl))",
            fontWeight: "var(--font-bold)",
            letterSpacing: "var(--tracking-tighter)",
            lineHeight: "var(--leading-tight)",
            color: "var(--color-text)",
          }}
        >
          Personal Project OS
        </h1>
        <p
          style={{
            margin: "var(--space-6) 0 var(--space-10) 0",
            fontSize: "var(--text-lg)",
            lineHeight: "var(--leading-relaxed)",
            color: "var(--color-text-muted)",
            maxWidth: "28rem",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Think, plan, and execute across multiple long-running projects. One place for context, decisions, and work that compounds.
        </p>
        <div
          style={{
            display: "flex",
            gap: "var(--space-4)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 48,
              padding: "0 var(--space-6)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-medium)",
              color: "var(--color-inverse)",
              backgroundColor: "var(--color-primary)",
              border: "none",
              borderRadius: "var(--radius-lg)",
              textDecoration: "none",
              boxShadow: "var(--shadow-md)",
              transition: "box-shadow var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 48,
              padding: "0 var(--space-6)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--font-medium)",
              color: "var(--color-text)",
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              textDecoration: "none",
              transition: "border-color var(--duration-fast) var(--ease-out), background-color var(--duration-fast) var(--ease-out)",
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
