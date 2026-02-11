import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const getSupabaseEnv = (): { url: string; anonKey: string } | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
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
    pathname === "/preview" ||
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

  const env = getSupabaseEnv();
  if (!env) {
    // No Supabase config: send everyone to preview so the app runs locally without setup
    const pathname = request.nextUrl.pathname;
    if (pathname !== "/preview" && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/preview", request.url));
    }
    return response;
  }

  const { url, anonKey } = env;
  let user: { id: string } | null = null;
  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    if (isProtectedPath(request.nextUrl.pathname)) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

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
