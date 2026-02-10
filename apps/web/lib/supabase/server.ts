import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getBypassUser, isAuthBypass } from "@/lib/auth-bypass";
import type { CurrentUser } from "@/lib/auth-bypass";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Server anon client (session from cookies). RLS applies.
 */
async function createAnonClient() {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
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
}

/**
 * Server Supabase client. When AUTH_BYPASS is set, returns service role (RLS bypassed).
 * Otherwise returns anon client with session. Use for all server-side data access.
 */
export async function createClient() {
  if (isAuthBypass()) {
    return createServiceRoleClient();
  }
  return createAnonClient();
}

/**
 * Current user for the request. When AUTH_BYPASS is set, returns the bypass user
 * (BYPASS_USER_ID / BYPASS_EMAIL). Otherwise returns the session user or null.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isAuthBypass()) {
    return getBypassUser();
  }
  const supabase = await createAnonClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}
