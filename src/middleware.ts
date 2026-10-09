import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user && request.nextUrl.pathname === "/login") return response;
  if (!user && request.nextUrl.pathname !== "/login") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/login";
    return NextResponse.redirect(destination);
  }
  if (user && request.nextUrl.pathname !== "/login") {
    const { data: membership } = await supabase.from("store_members").select("store_id").limit(1).maybeSingle();
    if (!membership && request.nextUrl.pathname !== "/configurar-loja") {
      const destination = request.nextUrl.clone();
      destination.pathname = "/configurar-loja";
      return NextResponse.redirect(destination);
    }
  }
  if (user && request.nextUrl.pathname === "/login") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/";
    return NextResponse.redirect(destination);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
