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
import { env } from '@/lib/config/env';

const MONACO_CDN = 'https://cdn.jsdelivr.net';
const GOOGLE_FONTS = 'https://fonts.googleapis.com';

function formatOrigin(host: string) {
  if (/^https?:\/\//i.test(host)) {
    return host;
  }
  return `https://${host}`;
}

function getTrustedOrigins(): string[] {
  const origins = env.trustedHosts
    .map((host) => formatOrigin(host))
    .filter(Boolean);
  return Array.from(new Set(origins));
}

function buildDirective(parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

function buildStrictCsp(isDev: boolean): string {
  const trustedOrigins = getTrustedOrigins();
  const scriptSources = ["'self'", GOOGLE_FONTS, MONACO_CDN, ...trustedOrigins, "'unsafe-inline'", 'blob:'];
  const styleSources = ["'self'", MONACO_CDN, ...trustedOrigins, "'unsafe-inline'", GOOGLE_FONTS];
  const fontSources = ["'self'", 'https://fonts.gstatic.com', MONACO_CDN, ...trustedOrigins, 'data:'];
  const connectSources = ["'self'", GOOGLE_FONTS, MONACO_CDN, ...trustedOrigins];
  if (isDev) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push('ws:', 'wss:');
  } else {
    // We need unsafe-eval for certain libraries even in production
    // Consider moving this logic to be route-specific if needed
    // but for now, the error 5a61793a9eb136e7.js suggests a build asset requires it.
    scriptSources.push("'unsafe-eval'");
  }
  const connectDirective = buildDirective(connectSources);

  return [
    "default-src 'self'",
    `script-src ${buildDirective(scriptSources)}`,
    `style-src ${buildDirective(styleSources)}`,
    "img-src 'self' data: https:",
    `font-src ${buildDirective(fontSources)}`,
    `connect-src ${connectDirective}`,
    "worker-src 'self' blob:",
    "frame-src 'self' blob: data: about:",
    "child-src 'self' blob: data: about:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

function buildTemplateEditorCsp(isDev: boolean): string {
  return buildStrictCsp(isDev);
}

function applyCspHeader(request: NextRequest, response: NextResponse): NextResponse {
  const isDev = !env.isProduction;
  const pathname = request.nextUrl.pathname;

  const isTemplateEditorRoute = pathname === '/templates/new' || /^\/templates\/[^/]+$/.test(pathname);
  const csp = isTemplateEditorRoute ? buildTemplateEditorCsp(isDev) : buildStrictCsp(isDev);

  response.headers.set('Content-Security-Policy', csp);
  return response;
}

async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();

  const sessionCookie =
    cookieStore.get('authjs.session-token')?.value ||
    cookieStore.get('__Secure-authjs.session-token')?.value ||
    cookieStore.get('next-auth.session-token')?.value ||
    cookieStore.get('__Secure-next-auth.session-token')?.value;

  return !!sessionCookie;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    return applyCspHeader(request, NextResponse.next());
  }

  if (shouldSkipProxy(pathname)) {
    return NextResponse.next();
  }

  const hasSession = await hasSessionCookie();
  const isPublic = isPublicPath(pathname);

  const trustedHosts = env.trustedHosts;
  if (trustedHosts.length > 0) {
    const host = request.headers.get('host');
    if (host && !trustedHosts.includes(host)) {
      return new NextResponse('Invalid Host', { status: 400 });
    }
  }

  if (!isPublic && !hasSession) {
    const loginUrl = new URL(DEFAULT_AUTH_REDIRECT, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return applyCspHeader(request, NextResponse.redirect(loginUrl));
  }

  return applyCspHeader(request, NextResponse.next());
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
