import { NextResponse, type NextRequest } from "next/server";
import { getDefaultRouteForRole, getSessionFromRequest, hasRouteAccess, isPublicPath } from "@/lib/auth-shared";

export function middleware(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const pathname = request.nextUrl.pathname;

  if (!session && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(session.role), request.url));
  }

  if (session && !isPublicPath(pathname) && !hasRouteAccess(pathname, session.role)) {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(session.role), request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-user-role", session?.role ?? "");
  requestHeaders.set("x-user-name", session?.full_name ?? "");

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
