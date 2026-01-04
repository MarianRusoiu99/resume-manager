/**
 * Test Setup and Utilities
 * 
 * Provides database setup, cleanup, and test utilities for Vitest tests
 */

import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Create a separate Prisma client for testing
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
    },
  },
});

/**
 * Setup database connection before all tests
 */
export async function setupTestDatabase() {
  await testDb.$connect();
}

/**
 * Cleanup database connection after all tests
 */
export async function teardownTestDatabase() {
  await testDb.$disconnect();
}

/**
 * Clean all database tables before each test
 * Deletes in order to respect foreign key constraints
 */
export async function cleanDatabase() {
  const tables = [
    'ApiKeyAuditLog',
    'UserAiPreference',
    'ApiModel',
    'ApiProvider',
    'AuditLog',
    'Notification',
    'CoverLetter',
    'ResumeDocument',
    'Resume',
    'ProfileDocument',
    'Profile',
    'JobPosting',
    'Company',
    'ResumeTemplate',
    'Session',
    'User',
  ];

  // Delete in reverse order to handle foreign key constraints
  for (const table of tables) {
    await testDb.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
}

/**
 * Setup hooks for test database lifecycle
 * Call this in your test files or in a global setup
 */
export function setupTestHooks() {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });
}

/**
 * Utility to wait for a specific amount of time
 * Useful for testing debounced functions
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock date that stays consistent during tests
 */
export function createMockDate(date: string = '2024-01-01T00:00:00.000Z'): Date {
  return new Date(date);
}
