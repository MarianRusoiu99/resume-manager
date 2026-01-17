"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericUserOwnedRepository = exports.GenericRepository = void 0;
exports.createPaginatedResult = createPaginatedResult;
const index_1 = require("@/lib/db/index");
/**
 * Create a paginated result object
 */
function createPaginatedResult(items, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        items,
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
    };
}
/**
 * Generic Repository for Prisma entities
 */
class GenericRepository {
    constructor(modelName, dbClient = index_1.prisma) {
        this.modelName = modelName;
        this.db = dbClient;
    }
    getDelegate(tx) {
        const client = tx || this.db;
        const delegate = client[this.modelName];
        if (!delegate) {
            throw new Error(`Prisma delegate for model "${this.modelName}" not found on client. Available keys: ${Object.keys(client).filter(k => !k.startsWith('_')).join(', ')}`);
        }
        return delegate;
    }
    async findById(id, userId, tx) {
        const where = { id };
        if (userId)
            where.userId = userId;
        return this.getDelegate(tx).findUnique({ where });
    }
    async findAll(args, tx) {
        return this.getDelegate(tx).findMany(args);
    }
    async create(data, tx) {
        return this.getDelegate(tx).create({ data });
    }
    async update(id, data, userId, tx) {
        const where = { id };
        if (userId)
            where.userId = userId;
        return this.getDelegate(tx).update({ where, data });
    }
    async delete(id, userId, tx) {
        const where = { id };
        if (userId)
            where.userId = userId;
        return this.getDelegate(tx).delete({ where });
    }
    async count(whereOrUserId, tx) {
        const where = typeof whereOrUserId === 'string' ? { userId: whereOrUserId } : whereOrUserId;
        return this.getDelegate(tx).count({ where });
    }
    async exists(id, userId, tx) {
        const c = await this.count({ id, ...(userId ? { userId } : {}) }, tx);
        return c > 0;
    }
}
exports.GenericRepository = GenericRepository;
/**
 * Generic Repository for User-Owned Prisma entities
 */
class GenericUserOwnedRepository extends GenericRepository {
    async findByIdForUser(id, userId, tx) {
        return this.findById(id, userId, tx);
    }
    async findAllForUser(userId, args, tx) {
        return this.findAll({
            ...args,
            where: { ...args?.where, userId },
        }, tx);
    }
    async updateForUser(id, userId, data, tx) {
        return this.update(id, data, userId, tx);
    }
    async deleteForUser(id, userId, tx) {
        return this.delete(id, userId, tx);
    }
    async existsForUser(id, userId, tx) {
        return this.exists(id, userId, tx);
    }
}
exports.GenericUserOwnedRepository = GenericUserOwnedRepository;
