/**
 * Mock for Authentication
 * 
 * Provides mock session and authentication utilities for testing
 */

import { vi } from 'vitest';
import type { Session } from 'next-auth';

/**
 * Create a mock session for testing
 */
export function createMockSession(overrides?: {
  userId?: string;
  email?: string;
  name?: string;
  isAdmin?: boolean;
}): Session {
  return {
    user: {
      id: overrides?.userId || 'test-user-id',
      email: overrides?.email || 'test@example.com',
      name: overrides?.name || 'Test User',
      isAdmin: overrides?.isAdmin || false,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  };
}

/**
 * Mock auth() function from next-auth
 */
export function mockAuth(session: Session | null = null) {
  return vi.fn().mockResolvedValue(session || createMockSession());
}

/**
 * Mock getServerSession function
 */
export function mockGetServerSession(session: Session | null = null) {
  return vi.fn().mockResolvedValue(session || createMockSession());
}

/**
 * Create an unauthenticated session (null)
 */
export function createUnauthenticatedSession() {
  return null;
}
