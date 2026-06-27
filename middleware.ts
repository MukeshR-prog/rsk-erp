import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check the session presence cookie
  const sessionActive = request.cookies.get("rsk-session-active")?.value === "true";

  const isLoginPage = pathname === "/login";

  if (!sessionActive && !isLoginPage) {
    // Redirect unauthenticated user trying to access app pages to /login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionActive && isLoginPage) {
    // Redirect authenticated user trying to access /login to the home dashboard
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo, icons, etc (media assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
