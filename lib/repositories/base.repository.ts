/**
 * Base Repository Class
 * 
 * Abstract base class for repositories providing common functionality:
 * - Database client injection
 * - Standard CRUD interface
 * - Query building helpers
 * 
 * @example
 * ```typescript
 * export class ProfileRepository extends BaseRepository<UserProfile> {
 *   protected readonly model = 'userProfile';
 *   
 *   async findAllByUserId(userId: string) {
 *     return this.db.userProfile.findMany({ where: { userId } });
 *   }
 * }
 * ```
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Generic type for entities with an ID
 */
export interface EntityWithId {
  id: string;
}

/**
 * Base repository options
 */
export interface BaseRepositoryOptions {
  /** Custom Prisma client instance (for testing) */
  dbClient?: PrismaClient;
}

/**
 * Query options for find operations
 */
export interface FindOptions {
  /** Number of records to return */
  limit?: number;
  /** Number of records to skip */
  offset?: number;
  /** Field to order by */
  orderBy?: string;
  /** Order direction */
  orderDir?: 'asc' | 'desc';
}

/**
 * Abstract base repository class
 * 
 * Provides common infrastructure for all repositories:
 * - Database client management
 * - Type-safe model access
 */
export abstract class BaseRepository<T extends EntityWithId = EntityWithId> {
  protected readonly db: PrismaClient;

  constructor(options: BaseRepositoryOptions = {}) {
    this.db = options.dbClient ?? prisma;
  }

  /**
   * Check if a record exists by ID
   */
  abstract exists(id: string): Promise<boolean>;

  /**
   * Find a record by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Delete a record by ID
   */
  abstract delete(id: string): Promise<boolean>;
}

/**
 * Base repository for user-owned entities
 * 
 * Extends BaseRepository with user ownership checks.
 * All operations verify that the entity belongs to the requesting user.
 */
export abstract class UserOwnedRepository<T extends EntityWithId = EntityWithId> extends BaseRepository<T> {
  /**
   * Check if a record exists and belongs to the user
   */
  abstract existsForUser(id: string, userId: string): Promise<boolean>;

  /**
   * Find a record by ID with user ownership check
   */
  abstract findByIdForUser(id: string, userId: string): Promise<T | null>;

  /**
   * Find all records for a user
   */
  abstract findAllForUser(userId: string, options?: FindOptions): Promise<T[]>;

  /**
   * Delete a record with user ownership check
   */
  abstract deleteForUser(id: string, userId: string): Promise<boolean>;
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
 * Build Prisma orderBy clause from options
 */
export function buildOrderBy(
  options?: Pick<FindOptions, 'orderBy' | 'orderDir'>,
  defaultField = 'createdAt',
  defaultDir: 'asc' | 'desc' = 'desc'
): Record<string, 'asc' | 'desc'> {
  const field = options?.orderBy ?? defaultField;
  const dir = options?.orderDir ?? defaultDir;
  return { [field]: dir };
}

/**
 * Build Prisma pagination clause from options
 */
export function buildPagination(
  options?: Pick<FindOptions, 'limit' | 'offset'>
): { take?: number; skip?: number } {
  return {
    take: options?.limit,
    skip: options?.offset,
  };
}

type PrismaUserOwnedDelegate<TEntity> = {
  create(args: { data: Record<string, unknown> }): Promise<TEntity>;
  findFirst(args: Record<string, unknown>): Promise<TEntity | null>;
  update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<TEntity>;
  delete(args: { where: Record<string, unknown> }): Promise<TEntity>;
  count(args: { where: Record<string, unknown> }): Promise<number>;
};

export abstract class PrismaUserOwnedCrudRepository<
  TEntity,
  TCreateInput,
  TUpdateInput
> {
  protected readonly db: PrismaClient;

  /** Prisma delegate name, e.g. `coverLetter`, `userProfile` */
  protected abstract readonly model: string;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  protected get delegate(): PrismaUserOwnedDelegate<TEntity> {
    return (this.db as unknown as Record<string, unknown>)[this.model] as PrismaUserOwnedDelegate<TEntity>;
  }

  protected buildCreateData(input: TCreateInput): Record<string, unknown> {
    return input as unknown as Record<string, unknown>;
  }

  protected buildUpdateData(input: TUpdateInput): Record<string, unknown> {
    return input as unknown as Record<string, unknown>;
  }

  protected buildWhere(id: string, userId: string): Record<string, unknown> {
    return {
      id,
      userId,
    };
  }

  protected buildFindByIdArgs(id: string, userId: string): Record<string, unknown> {
    return {
      where: this.buildWhere(id, userId),
    };
  }

  async create(input: TCreateInput): Promise<TEntity> {
    return this.delegate.create({
      data: this.buildCreateData(input),
    });
  }

  async findById(id: string, userId: string): Promise<TEntity | null> {
    return this.delegate.findFirst(this.buildFindByIdArgs(id, userId));
  }

  protected async updateExisting(where: Record<string, unknown>, input: TUpdateInput): Promise<TEntity> {
    return this.delegate.update({
      where,
      data: this.buildUpdateData(input),
    });
  }

  protected async deleteExisting(where: Record<string, unknown>): Promise<TEntity> {
    return this.delegate.delete({
      where,
    });
  }

  async update(id: string, userId: string, input: TUpdateInput): Promise<TEntity | null> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      return null;
    }

    return this.updateExisting(this.buildWhere(id, userId), input);
  }

  async delete(id: string, userId: string): Promise<TEntity | null> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      return null;
    }

    return this.deleteExisting(this.buildWhere(id, userId));
  }

  async exists(id: string, userId: string): Promise<boolean> {
    const count = await this.delegate.count({
      where: this.buildWhere(id, userId),
    });

    return count > 0;
  }
}
