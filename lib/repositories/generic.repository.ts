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
  where?: Record<string, any>;
  data?: Record<string, any>;
  include?: Record<string, any>;
  select?: Record<string, any>;
  orderBy?: Record<string, any> | Record<string, any>[];
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
    findUnique(args: { where: Record<string, any>; include?: any; select?: any }): Promise<any>;
    findFirst(args: { where: Record<string, any>; include?: any; select?: any; orderBy?: any }): Promise<any>;
    findMany(args?: PrismaArgs): Promise<any[]>;
    create(args: { data: TCreateInput; include?: any; select?: any }): Promise<any>;
    update(args: { where: Record<string, any>; data: TUpdateInput; include?: any; select?: any }): Promise<any>;
    delete(args: { where: Record<string, any>; include?: any; select?: any }): Promise<any>;
    count(args?: { where?: Record<string, any> }): Promise<number>;
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
    return (this.db as any)[this.modelName] as TPrismaDelegate;
  }

  async findById(id: string, userId?: string): Promise<T | null> {
    const where: Record<string, any> = { id };
    if (userId) where.userId = userId;
    return this.delegate.findUnique({ where });
  }

  async findAll(args?: PrismaArgs): Promise<T[]> {
    return this.delegate.findMany(args);
  }

  async create(data: TCreateInput): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: TUpdateInput, userId?: string): Promise<T> {
    const where: Record<string, any> = { id };
    if (userId) where.userId = userId;
    return this.delegate.update({ where, data });
  }

  async delete(id: string, userId?: string): Promise<T> {
    const where: Record<string, any> = { id };
    if (userId) where.userId = userId;
    return this.delegate.delete({ where });
  }

  async count(where?: Record<string, any>): Promise<number> {
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
    findUnique(args: { where: Record<string, any>; include?: any; select?: any }): Promise<any>;
    findFirst(args: { where: Record<string, any>; include?: any; select?: any; orderBy?: any }): Promise<any>;
    findMany(args?: PrismaArgs): Promise<any[]>;
    create(args: { data: TCreateInput; include?: any; select?: any }): Promise<any>;
    update(args: { where: Record<string, any>; data: TUpdateInput; include?: any; select?: any }): Promise<any>;
    delete(args: { where: Record<string, any>; include?: any; select?: any }): Promise<any>;
    count(args?: { where?: Record<string, any> }): Promise<number>;
  }
> extends GenericRepository<T, TCreateInput, TUpdateInput, TPrismaDelegate> {
  
  async findByIdForUser(id: string, userId: string): Promise<T | null> {
    return this.findById(id, userId);
  }

  async findAllForUser(userId: string, args?: PrismaArgs): Promise<T[]> {
    return this.findAll({
      ...args,
      where: { ...args?.where, userId },
    });
  }

  async updateForUser(id: string, userId: string, data: TUpdateInput): Promise<T> {
    return this.update(id, data, userId);
  }

  async deleteForUser(id: string, userId: string): Promise<T> {
    return this.delete(id, userId);
  }

  async existsForUser(id: string, userId: string): Promise<boolean> {
    const c = await this.count({ id, userId });
    return c > 0;
  }
}
