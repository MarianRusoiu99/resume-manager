import { ServiceResult } from '@/lib/types/service-result';
import { withServiceError, NotFoundError } from '@/lib/services/utils';
import { ICache } from '@/lib/repositories/interfaces';
import { type ZodType } from 'zod';

export abstract class GenericCrudService<
  T,
  TCreateInput,
  TUpdateInput,
  TFindAllArgs = Record<string, unknown>,
  TRepository extends {
    findById(id: string, userId?: string): Promise<T | null>;
    findAll(args?: TFindAllArgs): Promise<T[]>;
    create(data: TCreateInput): Promise<T>;
    update(id: string, data: TUpdateInput, userId?: string): Promise<T>;
    delete(id: string, userId?: string): Promise<T>;
  } = {
    findById(id: string, userId?: string): Promise<T | null>;
    findAll(args?: TFindAllArgs): Promise<T[]>;
    create(data: TCreateInput): Promise<T>;
    update(id: string, data: TUpdateInput, userId?: string): Promise<T>;
    delete(id: string, userId?: string): Promise<T>;
  }
> {
  constructor(
    protected readonly repository: TRepository,
    protected readonly resourceName: string,
    protected readonly cache?: ICache,
    protected readonly schemas?: {
      create?: ZodType<TCreateInput>;
      update?: ZodType<TUpdateInput>;
    }
  ) {}

  protected getCacheKey(id: string): string {
    return `${this.resourceName.toLowerCase()}:${id}`;
  }

  async getById(id: string): Promise<ServiceResult<T>> {
    return withServiceError(`fetch ${this.resourceName}`, async () => {
      if (this.cache) {
        const cached = this.cache.get(this.getCacheKey(id));
        if (cached) return cached as T;
      }

      const entity = await this.repository.findById(id);
      if (!entity) throw new NotFoundError(this.resourceName);

      if (this.cache) {
        this.cache.set(this.getCacheKey(id), entity);
      }

      return entity;
    });
  }

  async getAll(args?: TFindAllArgs): Promise<ServiceResult<T[]>> {
    return withServiceError(`fetch all ${this.resourceName}s`, async () => {
      return this.repository.findAll(args);
    });
  }

  async create(data: TCreateInput): Promise<ServiceResult<T>> {
    return withServiceError(`create ${this.resourceName}`, async () => {
      const validatedData = this.schemas?.create ? this.schemas.create.parse(data) : data;
      const entity = await this.repository.create(validatedData);
      return entity;
    });
  }

  async update(id: string, data: TUpdateInput, userId?: string): Promise<ServiceResult<T>> {
    return withServiceError(`update ${this.resourceName}`, async () => {
      const validatedData = this.schemas?.update ? this.schemas.update.parse(data) : data;
      const entity = await this.repository.update(id, validatedData, userId);
      
      if (this.cache) {
        this.cache.delete(this.getCacheKey(id));
      }
      
      return entity;
    });
  }

  async delete(id: string, userId?: string): Promise<ServiceResult<void>> {
    return withServiceError(`delete ${this.resourceName}`, async () => {
      await this.repository.delete(id, userId);
      if (this.cache) {
        this.cache.delete(this.getCacheKey(id));
      }
    });
  }
}

/**
 * Generic Service for User-Owned entities
 */
export abstract class GenericUserOwnedCrudService<
  T,
  TCreateInput,
  TUpdateInput,
  TFindAllArgs = Record<string, unknown>,
  TRepository extends {
    findById(id: string, userId?: string): Promise<T | null>;
    findAll(args?: TFindAllArgs): Promise<T[]>;
    create(data: TCreateInput): Promise<T>;
    update(id: string, data: TUpdateInput, userId?: string): Promise<T>;
    delete(id: string, userId?: string): Promise<T>;
    findByIdForUser(id: string, userId: string): Promise<T | null>;
    findAllForUser(userId: string, args?: TFindAllArgs): Promise<T[]>;
    updateForUser(id: string, userId: string, data: TUpdateInput): Promise<T>;
    deleteForUser(id: string, userId: string): Promise<T>;
  } = {
    findById(id: string, userId?: string): Promise<T | null>;
    findAll(args?: TFindAllArgs): Promise<T[]>;
    create(data: TCreateInput): Promise<T>;
    update(id: string, data: TUpdateInput, userId?: string): Promise<T>;
    delete(id: string, userId?: string): Promise<T>;
    findByIdForUser(id: string, userId: string): Promise<T | null>;
    findAllForUser(userId: string, args?: TFindAllArgs): Promise<T[]>;
    updateForUser(id: string, userId: string, data: TUpdateInput): Promise<T>;
    deleteForUser(id: string, userId: string): Promise<T>;
  }
> {
  constructor(
    protected readonly repository: TRepository,
    protected readonly resourceName: string,
    protected readonly cache?: ICache,
    protected readonly schemas?: {
      create?: ZodType<TCreateInput>;
      update?: ZodType<TUpdateInput>;
    }
  ) {}

  protected getCacheKey(id: string): string {
    return `${this.resourceName.toLowerCase()}:${id}`;
  }

  protected getUserListCacheKey(userId: string): string {
    return `${this.resourceName.toLowerCase()}:list:${userId}`;
  }

  async getById(id: string, userId: string): Promise<ServiceResult<T>> {
    return withServiceError(`fetch ${this.resourceName}`, async () => {
      if (this.cache) {
        const cached = this.cache.get(this.getCacheKey(id));
        if (cached) return cached as T;
      }

      const entity = await this.repository.findByIdForUser(id, userId);
      if (!entity) throw new NotFoundError(this.resourceName);

      if (this.cache) {
        this.cache.set(this.getCacheKey(id), entity);
      }

      return entity;
    });
  }

  async getAllForUser(userId: string, args?: TFindAllArgs): Promise<ServiceResult<T[]>> {
    return withServiceError(`fetch all ${this.resourceName}s`, async () => {
      if (this.cache) {
        const cached = this.cache.get(this.getUserListCacheKey(userId));
        if (cached) return cached as T[];
      }

      const entities = await this.repository.findAllForUser(userId, args);

      if (this.cache) {
        this.cache.set(this.getUserListCacheKey(userId), entities);
      }

      return entities;
    });
  }

  async create(data: TCreateInput & { userId: string }): Promise<ServiceResult<T>> {
    return withServiceError(`create ${this.resourceName}`, async () => {
      const validatedData = this.schemas?.create ? this.schemas.create.parse(data) : data;
      const entity = await this.repository.create(validatedData);
      
      if (this.cache) {
        this.cache.delete(this.getUserListCacheKey(data.userId));
      }
      
      return entity;
    });
  }

  async update(id: string, userId: string, data: TUpdateInput): Promise<ServiceResult<T>> {
    return withServiceError(`update ${this.resourceName}`, async () => {
      const validatedData = this.schemas?.update ? this.schemas.update.parse(data) : data;
      const entity = await this.repository.updateForUser(id, userId, validatedData);
      
      if (this.cache) {
        this.cache.delete(this.getCacheKey(id));
        this.cache.delete(this.getUserListCacheKey(userId));
      }
      
      return entity;
    });
  }

  async delete(id: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError(`delete ${this.resourceName}`, async () => {
      await this.repository.deleteForUser(id, userId);
      if (this.cache) {
        this.cache.delete(this.getCacheKey(id));
        this.cache.delete(this.getUserListCacheKey(userId));
      }
    });
  }
}
