/**
 * Mock Prisma Client
 *
 * Provides a deep mock of the PrismaClient for unit testing without database connections.
 * Uses vitest-mock-extended's mockDeep for complete type-safe mocking of all Prisma methods.
 *
 * @example
 * ```ts
 * // Basic usage in a test file
 * import { describe, it, expect, beforeEach, vi } from 'vitest';
 * import { prismaMock, resetPrismaMock, MockPrismaClient } from '@/__tests__/utils/mock-prisma';
 * import { createMockUser, createMockProfile } from '@/__tests__/utils/test-factories';
 *
 * // Mock the prisma import used by your service
 * vi.mock('@/lib/db/prisma', () => ({
 *   prisma: prismaMock,
 * }));
 *
 * describe('MyService', () => {
 *   beforeEach(() => {
 *     resetPrismaMock();
 *   });
 *
 *   it('should find a user by id', async () => {
 *     const mockUser = createMockUser({ id: 'user-123' });
 *     prismaMock.user.findUnique.mockResolvedValue(mockUser);
 *
 *     const result = await myService.getUser('user-123');
 *
 *     expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
 *       where: { id: 'user-123' },
 *     });
 *     expect(result).toEqual(mockUser);
 *   });
 *
 *   it('should create a profile', async () => {
 *     const mockProfile = createMockProfile({ userId: 'user-123' });
 *     prismaMock.profile.create.mockResolvedValue(mockProfile);
 *
 *     const result = await myService.createProfile('user-123', 'My Profile');
 *
 *     expect(prismaMock.profile.create).toHaveBeenCalled();
 *     expect(result).toEqual(mockProfile);
 *   });
 * });
 * ```
 *
 * @example
 * ```ts
 * // Testing transactions
 * import { prismaMock, resetPrismaMock } from '@/__tests__/utils/mock-prisma';
 *
 * beforeEach(() => {
 *   resetPrismaMock();
 *
 *   // Mock $transaction to execute the callback with the mock client
 *   prismaMock.$transaction.mockImplementation(async (callback) => {
 *     if (typeof callback === 'function') {
 *       return callback(prismaMock);
 *     }
 *     return Promise.all(callback);
 *   });
 * });
 * ```
 *
 * @example
 * ```ts
 * // Testing error scenarios
 * import { prismaMock } from '@/__tests__/utils/mock-prisma';
 *
 * it('should handle database errors', async () => {
 *   prismaMock.user.findUnique.mockRejectedValue(new Error('Connection failed'));
 *
 *   await expect(myService.getUser('user-123')).rejects.toThrow('Connection failed');
 * });
 * ```
 *
 * @module mock-prisma
 */

export {
  prismaMock,
  resetPrismaMock,
  type MockPrismaClient,
} from '@/lib/test/mocks/prisma-mock';
