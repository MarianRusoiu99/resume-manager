import { User } from '@prisma/client';

// Mock session for authenticated requests
export function createMockSession(user: Partial<User> = {}) {
  return {
    user: {
      id: user.id || 'test-user-id',
      email: user.email || 'test@example.com',
      name: user.name || 'Test User',
      emailVerified: user.emailVerified || new Date(),
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };
}

// Mock unauthenticated session
export function createUnauthenticatedSession() {
  return null;
}

// Mock auth function that returns session
export function mockAuth(session: ReturnType<typeof createMockSession> | null = null) {
  return async () => session;
}
