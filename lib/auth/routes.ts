/**
 * Route Configuration Constants
 * 
 * Centralized route definitions for authentication and authorization.
 * Used by proxy.ts and throughout the application for consistent routing.
 */

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
] as const;

/**
 * Auth routes - redirect to dashboard if already authenticated
 */
export const AUTH_ROUTES = [
  '/login',
  '/register',
] as const;

/**
 * API prefix - API routes handle their own auth
 */
export const API_PREFIX = '/api';

/**
 * Default redirect after login
 */
export const DEFAULT_LOGIN_REDIRECT = '/profile';

/**
 * Default redirect when not authenticated
 */
export const DEFAULT_AUTH_REDIRECT = '/login';

/**
 * Routes that are completely public (including API routes for public data)
 */
export const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/health',
  '/api/docs',
  '/api/public',
] as const;

/**
 * Check if a path is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  return (PUBLIC_ROUTES as readonly string[]).includes(pathname);
}

/**
 * Check if the pathname is an auth route (login/register)
 */
export function isAuthRoute(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname);
}

/**
 * Check if a path is an API route
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith(API_PREFIX);
}

/**
 * Check if a path is a public API route
 */
export function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a path should skip proxy processing entirely
 */
export function shouldSkipProxy(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // Static files (images, fonts, etc.)
  );
}
