# Supabase env setup (local only)

Create **`apps/web/.env.local`** (this file is gitignored; never commit it).

Set these variables using the values from your Supabase project dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=<your project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your publishable / anon key>
```

Optional (for server-only use, e.g. bypassing RLS when needed):

```
SUPABASE_SERVICE_ROLE_KEY=<your service role / secret key>
```

- **Project URL** and **publishable key** → Supabase Dashboard → Project Settings → API.
- **Service role key** → same place; use only in server code, never in the browser.

The app will fail fast at runtime if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing.
