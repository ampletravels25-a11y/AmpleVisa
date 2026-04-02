import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session_token")?.value;

  // Public routes - no auth needed
  const publicRoutes = ["/", "/login", "/signup", "/verify-otp", "/admin/login"];
  if (publicRoutes.includes(pathname) || pathname.startsWith("/api/auth")) {
    // If logged in and trying to access auth pages, redirect to dashboard
    if (token && ["/login", "/signup", "/verify-otp"].includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require auth
  if (!token) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads|api/(?!auth)).*)",
  ],
};
