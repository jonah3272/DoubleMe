import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseUrlOptional, getSupabaseServiceRoleKey } from "@/lib/env";

/**
 * Server-only Supabase client with the service role key.
 * Bypasses RLS. Use only when necessary (e.g. admin, background jobs).
 * Never expose this client or the service role key to the browser.
 * Throws a clear error if env is missing.
 */
export function createServiceRoleClient() {
  const url = getSupabaseUrlOptional();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase env. In apps/web/.env.local set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and for AUTH_BYPASS also SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
