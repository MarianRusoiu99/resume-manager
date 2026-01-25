import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/index';
import { TransactionClient } from '@/lib/db/transaction';

export interface EntityWithId {
  id: string;
}

export interface UserOwnedEntity extends EntityWithId {
  userId: string;
}

/**
 * Pagination result type
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Create a paginated result object
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
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
 * Common Prisma operation arguments
 */
export interface PrismaArgs {
  where?: Record<string, unknown>;
  data?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  take?: number;
  skip?: number;
}

/**
 * Prisma delegate type constraint - base interface for type safety
 */
export interface PrismaDelegate {
  findUnique(args: {
    where: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
  }): Promise<unknown>;
  findFirst(args?: {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Record<string, unknown>[];
    take?: number;
    skip?: number;
  }): Promise<unknown>;
  findMany(args?: {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Record<string, unknown>[];
    take?: number;
    skip?: number;
  }): Promise<unknown[]>;
  create(args: {
    data: unknown;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
  }): Promise<unknown>;
  update(args: {
    where: Record<string, unknown>;
    data: unknown;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
  }): Promise<unknown>;
  delete(args: {
    where: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
  }): Promise<unknown>;
  count(args?: {
    where?: Record<string, unknown>;
    take?: number;
    skip?: number;
  }): Promise<number>;
}

/**
 * Generic Repository for Prisma entities
 */
export abstract class GenericRepository<
  T extends EntityWithId,
  TCreateInput,
  TUpdateInput,
  TModelName extends keyof TransactionClient = keyof TransactionClient,
  TDelegate extends PrismaDelegate = PrismaDelegate
> {
  protected readonly db: PrismaClient;

  constructor(
    protected readonly modelName: TModelName,
    dbClient: PrismaClient = prisma
  ) {
    this.db = dbClient;
  }

  protected getDelegate(tx?: TransactionClient): TDelegate {
    const client = tx || (this.db as unknown as TransactionClient);
    const delegate = client[this.modelName];
    if (!delegate) {
      throw new Error(
        `Prisma delegate for model "${String(
          this.modelName
        )}" not found on client. Available keys: ${Object.keys(client)
          .filter((k) => !k.startsWith('_'))
          .join(', ')}`
      );
    }
    return delegate as unknown as TDelegate;
  }

  async findById(id: string, userId?: string, tx?: TransactionClient): Promise<T | null> {
    const where: Record<string, unknown> = { id };
    if (userId) where.userId = userId;
    return this.getDelegate(tx).findUnique({ where }) as Promise<T | null>;
  }

  async findAll(args?: PrismaArgs, tx?: TransactionClient): Promise<T[]> {
    return this.getDelegate(tx).findMany(args as Record<string, unknown>) as Promise<T[]>;
  }

  async create(data: TCreateInput, tx?: TransactionClient): Promise<T> {
    return this.getDelegate(tx).create({ data: data as unknown }) as Promise<T>;
  }

  async update(
    id: string,
    data: TUpdateInput,
    userId?: string,
    tx?: TransactionClient
  ): Promise<T> {
    const where: Record<string, unknown> = { id };
    if (userId) where.userId = userId;
    return this.getDelegate(tx).update({ where, data: data as unknown }) as Promise<T>;
  }

  async delete(id: string, userId?: string, tx?: TransactionClient): Promise<T> {
    const where: Record<string, unknown> = { id };
    if (userId) where.userId = userId;
    return this.getDelegate(tx).delete({ where }) as Promise<T>;
  }

  async count(
    whereOrUserId?: Record<string, unknown> | string,
    tx?: TransactionClient
  ): Promise<number> {
    const where = typeof whereOrUserId === 'string' ? { userId: whereOrUserId } : whereOrUserId;
    return this.getDelegate(tx).count({ where });
  }

  async exists(id: string, userId?: string, tx?: TransactionClient): Promise<boolean> {
    const c = await this.count({ id, ...(userId ? { userId } : {}) }, tx);
    return c > 0;
  }
}

/**
 * Generic Repository for User-Owned Prisma entities
 */
export abstract class GenericUserOwnedRepository<
  T extends UserOwnedEntity,
  TCreateInput,
  TUpdateInput,
  TModelName extends keyof TransactionClient = keyof TransactionClient,
  TDelegate extends PrismaDelegate = PrismaDelegate
> extends GenericRepository<T, TCreateInput, TUpdateInput, TModelName, TDelegate> {
  async findByIdForUser(id: string, userId: string, tx?: TransactionClient): Promise<T | null> {
    return this.findById(id, userId, tx);
  }

  async findAllForUser(userId: string, args?: PrismaArgs, tx?: TransactionClient): Promise<T[]> {
    return this.findAll(
      {
        ...args,
        where: { ...args?.where, userId } as Record<string, unknown>,
      },
      tx
    );
  }

  async updateForUser(
    id: string,
    userId: string,
    data: TUpdateInput,
    tx?: TransactionClient
  ): Promise<T> {
    return this.update(id, data, userId, tx);
  }

  async deleteForUser(id: string, userId: string, tx?: TransactionClient): Promise<T> {
    return this.delete(id, userId, tx);
  }

  async existsForUser(id: string, userId: string, tx?: TransactionClient): Promise<boolean> {
    return this.exists(id, userId, tx);
  }
}

