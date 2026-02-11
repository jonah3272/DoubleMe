import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const DEV_EMAIL = "jonah3272@gmail.com";
const DEV_PASSWORD = "Stacy3272";

/**
 * One-time setup: ensure a dev user exists with the given password.
 * POST /api/seed-dev-user — creates or updates the user (service role required).
 */
export async function POST() {
  try {
    const supabase = createServiceRoleClient();
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    const existing = users?.find((u) => u.email === DEV_EMAIL);

    if (existing) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existing.id,
        { password: DEV_PASSWORD }
      );
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        message: "User updated with password.",
        email: DEV_EMAIL,
      });
    }

    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
      email_confirm: true,
    });
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      message: "User created.",
      email: DEV_EMAIL,
      id: data.user?.id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Seed failed" },
      { status: 500 }
    );
  }
}
