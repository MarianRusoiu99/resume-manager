/**
 * Auth Module Index
 * 
 * Re-exports all auth utilities for convenient importing.
 */

// Data Access Layer (DAL)
export {
  verifySession,
  getSession,
  getCurrentUserId,
  requireUserId,
  checkRole,
  getSessionCookie,
  hasSessionCookie,
  type SessionPayload,
} from './dal';

// Route configuration
export {
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  API_PREFIX,
  DEFAULT_LOGIN_REDIRECT,
  DEFAULT_AUTH_REDIRECT,
  PUBLIC_API_ROUTES,
  isPublicRoute,
  isAuthRoute,
  isApiRoute,
  isPublicApiRoute,
  shouldSkipProxy,
} from './routes';

// NextAuth config and functions
export { auth, signIn, signOut, handlers } from './config';

// Password utilities
export { hashPassword, verifyPassword } from './password';
