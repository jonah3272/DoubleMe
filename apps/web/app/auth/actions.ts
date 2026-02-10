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
