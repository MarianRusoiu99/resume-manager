import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // @ts-expect-error: custom auth property
  const isAuthenticated = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/api/auth");

  // Redirect to login if accessing protected route while not authenticated
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  // Call custom auth logic if needed
  // If you need to run custom logic, call your auth function here
  return NextResponse.next();
}

export const config = {
  matcher: [String.raw`/((?!_next/static|_next/image|favicon.ico|.*\..*).*)`],
};
