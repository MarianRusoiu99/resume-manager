import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/index';

export interface EntityWithId {
  id: string;
}

export interface UserOwnedEntity extends EntityWithId {
  userId: string;
}

/**
 * Generic Repository for Prisma entities
 */
export abstract class GenericRepository<
  T extends EntityWithId,
  TCreateInput,
  TUpdateInput,
  TPrismaDelegate extends {
    findUnique(args: any): Promise<any>;
    findFirst(args: any): Promise<any>;
    findMany(args: any): Promise<any[]>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
    delete(args: any): Promise<any>;
    count(args: any): Promise<number>;
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
    return (this.db as any)[this.modelName];
  }

  async findById(id: string, userId?: string): Promise<T | null> {
    const where: any = { id };
    if (userId) where.userId = userId;
    return this.delegate.findUnique({ where });
  }

  async findAll(args?: any): Promise<T[]> {
    return this.delegate.findMany(args);
  }

  async create(data: TCreateInput): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: TUpdateInput, userId?: string): Promise<T> {
    const where: any = { id };
    if (userId) where.userId = userId;
    return this.delegate.update({ where, data });
  }

  async delete(id: string, userId?: string): Promise<T> {
    const where: any = { id };
    if (userId) where.userId = userId;
    return this.delegate.delete({ where });
  }

  async count(where?: any): Promise<number> {
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
    findUnique(args: any): Promise<any>;
    findFirst(args: any): Promise<any>;
    findMany(args: any): Promise<any[]>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
    delete(args: any): Promise<any>;
    count(args: any): Promise<number>;
  }
> extends GenericRepository<T, TCreateInput, TUpdateInput, TPrismaDelegate> {
  
  async findByIdForUser(id: string, userId: string): Promise<T | null> {
    return this.findById(id, userId);
  }

  async findAllForUser(userId: string, args?: any): Promise<T[]> {
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
