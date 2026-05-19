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
const GOOGLE_FONTS_STYLES = 'https://fonts.googleapis.com';
const GOOGLE_FONTS_FONTS = 'https://fonts.gstatic.com';

function formatOrigin(host: string) {
  if (/^https?:\/\//i.test(host)) {
    return host;
  }
  return `https://${host}`;
}

function normalizeHost(host: string): string {
  return host.trim().toLowerCase();
}

function extractHost(originOrHost: string): string {
  try {
    return normalizeHost(new URL(formatOrigin(originOrHost)).host);
  } catch {
    return normalizeHost(originOrHost);
  }
}

function getTrustedOrigins(): string[] {
  const origins = env.trustedHosts
    .map((host) => formatOrigin(host))
    .filter(Boolean);
  return Array.from(new Set(origins));
}

function getTrustedHostsSet(): Set<string> {
  const trusted = new Set<string>();
  for (const host of env.trustedHosts) {
    const normalizedHost = extractHost(host);
    trusted.add(normalizedHost);
    trusted.add(normalizedHost.split(':')[0]);
  }
  return trusted;
}

function buildDirective(parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

function unique(parts: string[]): string[] {
  return Array.from(new Set(parts));
}

function buildStrictCsp(isDev: boolean): string {
  const connectSources = ["'self'"];
  if (isDev) {
    connectSources.push('ws:', 'wss:');
  }

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    `style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS_STYLES}`,
    "img-src 'self' data: https:",
    `font-src 'self' data: ${GOOGLE_FONTS_FONTS}`,
    `connect-src ${buildDirective(connectSources)}`,
    "worker-src 'self' blob:",
    "frame-src 'self' blob: data:",
    "child-src 'self' blob: data:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

function buildTemplateEditorCsp(isDev: boolean): string {
  const trustedOrigins = getTrustedOrigins();

  const scriptSources = unique([
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "'wasm-unsafe-eval'",
    'blob:',
    MONACO_CDN,
    ...trustedOrigins,
  ]);

  const styleSources = unique([
    "'self'",
    "'unsafe-inline'",
    GOOGLE_FONTS_STYLES,
    MONACO_CDN,
    ...trustedOrigins,
  ]);

  const fontSources = unique([
    "'self'",
    'data:',
    GOOGLE_FONTS_FONTS,
    MONACO_CDN,
    ...trustedOrigins,
  ]);

  const connectSources = unique([
    "'self'",
    MONACO_CDN,
    ...trustedOrigins,
  ]);

  if (isDev) {
    connectSources.push('ws:', 'wss:');
  }

  return [
    "default-src 'self'",
    `script-src ${buildDirective(scriptSources)}`,
    `style-src ${buildDirective(styleSources)}`,
    "img-src 'self' data: https:",
    `font-src ${buildDirective(fontSources)}`,
    `connect-src ${buildDirective(connectSources)}`,
    "worker-src 'self' blob: data:",
    "frame-src 'self' blob: data:",
    "child-src 'self' blob: data:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

function isTemplateEditorPath(pathname: string): boolean {
  return pathname === '/templates/new' || /^\/templates\/[^/]+$/.test(pathname);
}

function applyCspHeader(request: NextRequest, response: NextResponse): NextResponse {
  const isDev = !env.isProduction;
  const pathname = request.nextUrl.pathname;
  const csp = isTemplateEditorPath(pathname)
    ? buildTemplateEditorCsp(isDev)
    : buildStrictCsp(isDev);

  response.headers.set('Content-Security-Policy', csp);
  return response;
}

function isRequestHostTrusted(request: NextRequest): boolean {
  const trustedHosts = env.trustedHosts;
  if (trustedHosts.length === 0) {
    return true;
  }

  const host = request.headers.get('host');
  if (!host) {
    return false;
  }

  const trustedHostsSet = getTrustedHostsSet();
  const normalizedHost = normalizeHost(host);
  const hostWithoutPort = normalizedHost.split(':')[0];
  return trustedHostsSet.has(normalizedHost) || trustedHostsSet.has(hostWithoutPort);
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

  if (!isRequestHostTrusted(request)) {
    return new NextResponse('Invalid Host', { status: 400 });
  }

  if (pathname.startsWith('/api/')) {
    return applyCspHeader(request, NextResponse.next());
  }

  if (shouldSkipProxy(pathname)) {
    return NextResponse.next();
  }

  const hasSession = await hasSessionCookie();
  const isPublic = isPublicPath(pathname);

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
