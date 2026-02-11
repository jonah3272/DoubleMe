"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Confirm a user's email (so they can sign in without clicking a link).
 * Uses service role. No-op if service role key is not set.
 */
export async function confirmUserEmail(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not confirm (service role required)." };
  }
}

/**
 * Create a user via Admin API (no email sent). Instant signup when SUPABASE_SERVICE_ROLE_KEY is set.
 */
export async function createUserNoEmail(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existing = users?.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: password.trim(),
        email_confirm: true,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
    const { error } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Signup failed (service role required)." };
  }
}
