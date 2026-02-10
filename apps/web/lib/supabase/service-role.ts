import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseUrl, getSupabaseServiceRoleKey } from "@/lib/env";

/**
 * Server-only Supabase client with the service role key.
 * Bypasses RLS. Use only when necessary (e.g. admin, background jobs).
 * Never expose this client or the service role key to the browser.
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not set.
 */
export function createServiceRoleClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation.");
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
