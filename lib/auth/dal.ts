/**
 * Data Access Layer (DAL) for Authentication
 * 
 * This module centralizes all authentication and authorization logic.
 * Uses React's cache() to memoize results during a single request.
 * 
 * Best Practices (per Next.js 16 docs):
 * - Auth checks should happen close to the data source
 * - Use verifySession() in Server Components, Server Actions, Route Handlers
 * - DAL functions are cached per-request to avoid duplicate DB calls
 * 
 * @see https://nextjs.org/docs/app/guides/authentication
 */
import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './config';
import { prisma } from '@/lib/db/index';

/**
 * Session payload returned by verifySession
 */
export interface SessionPayload {
  isAuth: true;
  userId: string;
  email?: string | null;
  name?: string | null;
  isAdmin: boolean;
}

/**
 * Verify the current session and return user info.
 * Redirects to login if not authenticated.
 * 
 * Uses React's cache() to memoize results during a single request,
 * preventing duplicate auth() calls in the same render pass.
 * 
 * @example
 * // In a Server Component or Server Action
 * const session = await verifySession();
 * const data = await fetchUserData(session.userId);
 */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return {
    isAuth: true,
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isAdmin: session.user.isAdmin,
  };
});

/**
 * Get session without redirecting.
 * Returns null if not authenticated.
 * 
 * Useful for conditional rendering or optional auth checks.
 * 
 * @example
 * const session = await getSession();
 * if (session) {
 *   // User is authenticated
 * }
 */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    isAuth: true,
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isAdmin: session.user.isAdmin,
  };
});

/**
 * Get session with database verification.
 * Returns null if not authenticated OR if user no longer exists in database.
 * 
 * Use this for sensitive operations where you need to ensure the user still exists.
 */
export const getVerifiedSession = cache(async (): Promise<SessionPayload | null> => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Verify user still exists in database
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!userExists) {
    return null;
  }

  return {
    isAuth: true,
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isAdmin: session.user.isAdmin,
  };
});

/**
 * Get the current user ID without redirecting.
 * Returns null if not authenticated.
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const session = await getSession();
  return session?.userId ?? null;
});

/**
 * Require authentication and return user ID.
 * Redirects to login if not authenticated.
 * 
 * Shorthand for when you only need the userId.
 */
export const requireUserId = cache(async (): Promise<string> => {
  const session = await verifySession();
  return session.userId;
});

/**
 * Check if user has a specific role.
 * 
 * Note: Role-based access control is not yet implemented.
 * This function currently returns true for all authenticated users.
 * When roles are added to the User schema, this should be updated to
 * check against the user's actual roles.
 * 
 * @param requiredRole - The role to check for (currently unused)
 * @returns true if user is authenticated, false otherwise
 */
export const requireAdmin = cache(async (): Promise<boolean> => {
  const session = await getSession();
  return Boolean(session?.isAdmin);
});

/**
 * Get session cookie value for optimistic checks in Proxy.
 * This reads directly from cookies without hitting the database.
 * 
 * Used by proxy.ts for lightweight session checks.
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  
  // NextAuth v5 stores session in multiple possible cookie names
  const sessionCookie = 
    cookieStore.get('authjs.session-token')?.value ||
    cookieStore.get('__Secure-authjs.session-token')?.value ||
    cookieStore.get('next-auth.session-token')?.value ||
    cookieStore.get('__Secure-next-auth.session-token')?.value;
  
  return sessionCookie;
}

/**
 * Check if session cookie exists (optimistic check for Proxy).
 * Does NOT verify the session is valid - use verifySession() for that.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const cookie = await getSessionCookie();
  return !!cookie;
}
