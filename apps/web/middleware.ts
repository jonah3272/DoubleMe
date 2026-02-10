import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const getSupabaseEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
};

const isProtectedPath = (pathname: string) => {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/projects");
};

const isPublicPath = (pathname: string) => {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/ui") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  );
};

const isAuthBypass = () =>
  process.env.AUTH_BYPASS === "true" || process.env.AUTH_BYPASS === "1";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (isAuthBypass()) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      return response;
    }
    if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
