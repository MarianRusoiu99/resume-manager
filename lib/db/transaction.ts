import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Transaction client type for use in callbacks
 */
export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Options for the interactive transaction
 */
export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Executes a callback within a Prisma interactive transaction.
 *
 * @example
 * ```ts
 * const result = await withTransaction(async (tx) => {
 *   await tx.profile.update({ where: { id: 1 }, data: { isDefault: false } });
 *   await tx.profile.update({ where: { id: 2 }, data: { isDefault: true } });
 *   return { success: true };
 * });
 * ```
 *
 * @param callback - Function receiving the transaction client
 * @param options - Optional transaction options (maxWait, timeout, isolationLevel)
 * @returns The result of the callback
 * @throws Rolls back all operations if any error occurs
 */
export async function withTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  return prisma.$transaction(callback, options);
}
