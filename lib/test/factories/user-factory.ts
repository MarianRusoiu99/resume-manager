import { User } from '@prisma/client';

/**
 * Creates a mock User object for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2a$10$hashedpassword',
    isAdmin: false,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/**
 * Creates multiple mock users
 */
export function createMockUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => 
    createMockUser({
      id: `user-${i + 1}`,
      email: `test${i + 1}@example.com`,
      name: `Test User ${i + 1}`,
    })
  );
}
