import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/index';

export interface EntityWithId {
  id: string;
}

export interface UserOwnedEntity extends EntityWithId {
  userId: string;
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
 * Generic Repository for Prisma entities
 */
export abstract class GenericRepository<
  T extends EntityWithId,
  TCreateInput,
  TUpdateInput,
  TPrismaDelegate extends {
    findUnique(args: { where: Record<string, unknown>; include?: unknown; select?: unknown }): Promise<unknown>;
    findFirst(args: { where: Record<string, unknown>; include?: unknown; select?: unknown; orderBy?: unknown }): Promise<unknown>;
    findMany(args?: PrismaArgs): Promise<unknown[]>;
    create(args: { data: TCreateInput; include?: unknown; select?: unknown }): Promise<unknown>;
    update(args: { where: Record<string, unknown>; data: TUpdateInput; include?: unknown; select?: unknown }): Promise<unknown>;
    delete(args: { where: Record<string, unknown>; include?: unknown; select?: unknown }): Promise<unknown>;
    count(args?: { where?: Record<string, unknown> }): Promise<number>;
  }
> {
  protected readonly db: PrismaClient;

  constructor(
    protected readonly modelName: string,
    dbClient: PrismaClient = prisma
  ) {
    this.db = dbClient;
  }

  protected get delegate(): TPrismaDelegate {
    return (this.db as unknown as Record<string, TPrismaDelegate>)[this.modelName];
  }

  async findById(id: string, userId?: string): Promise<T | null> {
    const where: Record<string, unknown> = { id };
    if (userId) where.userId = userId;
    return this.delegate.findUnique({ where }) as Promise<T | null>;
  }

  async findAll(args?: PrismaArgs): Promise<T[]> {
    return this.delegate.findMany(args) as Promise<T[]>;
  }

  async create(data: TCreateInput): Promise<T> {
    return this.delegate.create({ data }) as Promise<T>;
  }

  async update(id: string, data: TUpdateInput, userId?: string): Promise<T> {
    const where: Record<string, unknown> = { id };
    if (userId) where.userId = userId;
    return this.delegate.update({ where, data }) as Promise<T>;
  }

  async delete(id: string, userId?: string): Promise<T> {
    const where: Record<string, unknown> = { id };
    if (userId) where.userId = userId;
    return this.delegate.delete({ where }) as Promise<T>;
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.delegate.count({ where });
  }

  async exists(id: string): Promise<boolean> {
    const c = await this.count({ id });
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
  TPrismaDelegate extends {
    findUnique(args: { where: Record<string, unknown>; include?: unknown; select?: unknown }): Promise<unknown>;
    findFirst(args: { where: Record<string, unknown>; include?: unknown; select?: unknown; orderBy?: unknown }): Promise<unknown>;
    findMany(args?: PrismaArgs): Promise<unknown[]>;
    create(args: { data: TCreateInput; include?: unknown; select?: unknown }): Promise<unknown>;
    update(args: { where: Record<string, unknown>; data: TUpdateInput; include?: unknown; select?: unknown }): Promise<unknown>;
    delete(args: { where: Record<string, unknown>; include?: unknown; select?: unknown }): Promise<unknown>;
    count(args?: { where?: Record<string, unknown> }): Promise<number>;
  }
> extends GenericRepository<T, TCreateInput, TUpdateInput, TPrismaDelegate> {
  
  async findByIdForUser(id: string, userId: string): Promise<T | null> {
    return this.findById(id, userId);
  }

  async findAllForUser(userId: string, args?: PrismaArgs): Promise<T[]> {
    return this.findAll({
      ...args,
      where: { ...args?.where, userId } as Record<string, unknown>,
    });
  }

  async updateForUser(id: string, userId: string, data: TUpdateInput): Promise<T> {
    return this.update(id, data, userId);
  }

  async deleteForUser(id: string, userId: string): Promise<T> {
    return this.delete(id, userId);
  }

  async existsForUser(id: string, userId: string): Promise<boolean> {
    const c = await this.count({ id, userId } as Record<string, unknown>);
    return c > 0;
  }
}
