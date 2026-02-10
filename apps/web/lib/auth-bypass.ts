/**
 * Auth bypass for local/dev: treat as logged-in user without a real session.
 * Set AUTH_BYPASS=true and BYPASS_USER_ID=<uuid> in .env.local.
 * Create a user in Supabase Auth (Dashboard → Authentication) with email
 * Jonahrehbeinjones@gmail.com and use that user's UUID as BYPASS_USER_ID.
 */

export function isAuthBypass(): boolean {
  return process.env.AUTH_BYPASS === "true" || process.env.AUTH_BYPASS === "1";
}

export function getBypassUserId(): string {
  const id = process.env.BYPASS_USER_ID;
  if (!id) {
    throw new Error(
      "AUTH_BYPASS is set but BYPASS_USER_ID is missing. Create a user in Supabase Auth (e.g. Jonahrehbeinjones@gmail.com) and set BYPASS_USER_ID to that user's UUID."
    );
  }
  return id;
}

export function getBypassEmail(): string {
  return process.env.BYPASS_EMAIL ?? "Jonahrehbeinjones@gmail.com";
}

export type CurrentUser = {
  id: string;
  email: string | null;
};

export function getBypassUser(): CurrentUser {
  return {
    id: getBypassUserId(),
    email: getBypassEmail(),
  };
}
