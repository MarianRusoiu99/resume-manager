"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = withTransaction;
const db_1 = require("@/lib/db");
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
async function withTransaction(callback, options) {
    return db_1.prisma.$transaction(callback, options);
}
