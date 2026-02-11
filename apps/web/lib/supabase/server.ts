import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getBypassUser, isAuthBypass } from "@/lib/auth-bypass";
import type { CurrentUser } from "@/lib/auth-bypass";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseUrlOptional,
  getSupabaseAnonKeyOptional,
} from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Server anon client (session from cookies). RLS applies.
 * Returns null when Supabase env vars are missing or when client creation fails (e.g. invalid key).
 */
async function createAnonClient(): Promise<ReturnType<typeof createServerClient> | null> {
  const url = getSupabaseUrlOptional();
  const anonKey = getSupabaseAnonKeyOptional();
  if (!url || !anonKey) return null;
  try {
    const cookieStore = await cookies();
    return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components / Route Handlers that can't set cookies
          }
        },
      },
    });
  } catch {
    return null;
  }
}

/**
 * Server Supabase client. When AUTH_BYPASS is set, returns service role (RLS bypassed).
 * Otherwise returns anon client with session. Throws if env vars missing (use getCurrentUser for safe check).
 */
export async function createClient() {
  if (isAuthBypass()) {
    return createServiceRoleClient();
  }
  const client = await createAnonClient();
  if (!client) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return client;
}

/**
 * Current user for the request. When AUTH_BYPASS is set, returns the bypass user
 * (BYPASS_USER_ID / BYPASS_EMAIL). Otherwise returns the session user or null.
 * Returns null when Supabase env vars are missing or when Supabase errors (e.g. invalid key).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isAuthBypass()) {
    return getBypassUser();
  }
  try {
    const supabase = await createAnonClient();
    if (!supabase) return null;
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}
