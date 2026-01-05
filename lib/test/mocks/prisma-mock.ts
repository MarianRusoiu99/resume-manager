import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

/**
 * Type for the mocked Prisma client
 */
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

/**
 * Deep mock of the Prisma client for testing
 */
export const prismaMock = mockDeep<PrismaClient>();

/**
 * Resets all mocks on the Prisma client
 */
export function resetPrismaMock() {
  mockReset(prismaMock);
}
