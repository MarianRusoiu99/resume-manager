/**
 * Proxy (formerly Middleware) - Next.js 16
 * 
 * Performs OPTIMISTIC checks only (reads from cookie, no database calls).
 * Real auth verification happens in DAL (verifySession).
 * 
 * Best Practices (per Next.js 16 docs):
 * - Proxy runs on every route including prefetched routes
 * - Only read session from cookie (optimistic check)
 * - Avoid database checks to prevent performance issues
 * - Use DAL for secure checks close to data source
 * 
 * @see https://nextjs.org/docs/app/guides/authentication#optimistic-checks-with-proxy-optional
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  DEFAULT_LOGIN_REDIRECT,
  DEFAULT_AUTH_REDIRECT,
  shouldSkipProxy,
  isPublicRoute,
  isAuthRoute,
} from '@/lib/auth/routes';

/**
 * Check if session cookie exists (optimistic check).
 * Does NOT verify the session is valid.
 */
async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  
  // NextAuth v5 stores session in multiple possible cookie names
  const sessionCookie = 
    cookieStore.get('authjs.session-token')?.value ||
    cookieStore.get('__Secure-authjs.session-token')?.value ||
    cookieStore.get('next-auth.session-token')?.value ||
    cookieStore.get('__Secure-next-auth.session-token')?.value;
  
  return !!sessionCookie;
}

/**
 * Proxy function - runs before every request
 * 
 * Performs optimistic auth checks based on cookie presence.
 * Actual session validation happens in DAL/Server Components.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static assets and API routes
  if (shouldSkipProxy(pathname)) {
    return NextResponse.next();
  }

  // Optimistic check: does session cookie exist?
  const hasSession = await hasSessionCookie();
  const isPublic = isPublicRoute(pathname);
  const isAuth = isAuthRoute(pathname);

  // Redirect to login if accessing protected route without session cookie
  if (!isPublic && !hasSession) {
    const loginUrl = new URL(DEFAULT_AUTH_REDIRECT, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to profile if accessing auth pages with session cookie
  if (isAuth && hasSession) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
  }

  return NextResponse.next();
}

// Export as default for Next.js 16 compatibility
export default proxy;

/**
 * Matcher configuration
 * 
 * Excludes:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico
 * - Public assets with extensions
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
