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
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_AUTH_REDIRECT,
  shouldSkipProxy,
  isPublicPath,
} from '@/lib/auth/routes';

function buildStrictCsp(isDev: boolean): string {
  return [
    "default-src 'self'",
    // Next.js dev builds rely on eval (source maps/fast refresh).
    // Production needs blob: for PDF.js and preview workers.
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:"
      : "script-src 'self' 'unsafe-inline' blob:",
    // Tailwind/shadcn/Next commonly rely on inline styles.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    // Client-side API calls (and HMR websocket in dev).
    isDev
      ? "connect-src 'self' ws: wss: https://fonts.googleapis.com"
      : "connect-src 'self' https://fonts.googleapis.com",
    // PDF.js and other workers need blob: URLs.
    "worker-src 'self' blob:",
    // Previews render HTML in iframes via srcDoc/blob URLs.
    "frame-src 'self' blob: data: about:",
    // Deprecated but still used by some browsers as a fallback.
    "child-src 'self' blob: data: about:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

function buildTemplateEditorCsp(isDev: boolean): string {
  return [
    "default-src 'self'",
    // Monaco uses eval for workers in some builds and loads assets from CDN.
    // Allow blob: because some Monaco bundles create blob-based loaders.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    // Allow Monaco CDN; add ws/wss in dev for HMR.
    isDev
      ? "connect-src 'self' ws: wss: https://fonts.googleapis.com https://cdn.jsdelivr.net"
      : "connect-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "worker-src 'self' blob:",
    // Previews render HTML in iframes via srcDoc/blob URLs.
    "frame-src 'self' blob: data: about:",
    // Deprecated but still used by some browsers as a fallback.
    "child-src 'self' blob: data: about:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

function applyCspHeader(request: NextRequest, response: NextResponse): NextResponse {
  const isDev = process.env.NODE_ENV !== 'production';
  const pathname = request.nextUrl.pathname;

  const isTemplateEditorRoute = pathname === '/templates/new' || /^\/templates\/[^/]+$/.test(pathname);
  const csp = isTemplateEditorRoute ? buildTemplateEditorCsp(isDev) : buildStrictCsp(isDev);

  response.headers.set('Content-Security-Policy', csp);
  return response;
}

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

  // API routes handle auth themselves; never redirect.
  if (pathname.startsWith('/api/')) {
    return applyCspHeader(request, NextResponse.next());
  }

  // Skip proxy for static assets
  if (shouldSkipProxy(pathname)) {
    return NextResponse.next();
  }

  // Optimistic check: does session cookie exist?
  const hasSession = await hasSessionCookie();
  const isPublic = isPublicPath(pathname);

  // Redirect to login if accessing protected route without session cookie
  if (!isPublic && !hasSession) {
    const loginUrl = new URL(DEFAULT_AUTH_REDIRECT, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return applyCspHeader(request, NextResponse.redirect(loginUrl));
  }

  // Remove optimistic redirect to profile for auth pages
  // This prevents infinite loops when session cookie exists but session is invalid
  // Client-side logic in login page will handle redirecting authenticated users
  


  return applyCspHeader(request, NextResponse.next());
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
