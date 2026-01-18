/**
 * API Provider Repository
 * Handles database operations for API provider management
 */

import { prisma } from '@/lib/db/index';
import { PrismaClient, ProviderType, ApiProvider } from '@prisma/client';
import { GenericUserOwnedRepository } from './generic.repository';
import { RecordNotFoundError } from '@/lib/errors/database';
import { TransactionClient } from '@/lib/db/transaction';
import type { 
  IApiProviderRepository, 
  CreateApiProviderInput, 
  UpdateApiProviderInput,
  ApiProviderWithModels 
} from './interfaces/api-providers.repository.interface';

/**
 * Convert lowercase provider string to Prisma ProviderType enum
 */
function toProviderType(provider: string): ProviderType {
  return provider.toUpperCase() as ProviderType;
}

export class ApiProviderRepository 
  extends GenericUserOwnedRepository<ApiProviderWithModels, CreateApiProviderInput, UpdateApiProviderInput>
  implements IApiProviderRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('apiProvider', dbClient);
  }

  /**
   * Create a new API provider
   */
  override async create(data: CreateApiProviderInput, tx?: TransactionClient): Promise<ApiProviderWithModels> {
    return this.getDelegate(tx).create({
      data: {
        userId: data.userId,
        name: data.name,
        encryptedKey: data.encryptedKey,
        provider: toProviderType(data.provider),
        models: {
          create: data.models.map((modelKey) => ({ modelKey })),
        },
      },
      include: {
        models: true,
      },
    }) as Promise<ApiProviderWithModels>;
  }

  /**
   * Find all API providers for a user
   */
  async findByUserId(userId: string, includeInactive = false, tx?: TransactionClient): Promise<ApiProviderWithModels[]> {
    return this.findAllForUser(userId, {
      where: {
        ...(includeInactive ? {} : { isActive: true, revokedAt: null }),
      },
      include: {
        models: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }, tx);
  }

  /**
   * Find a specific API provider by ID
   */
  override async findById(id: string, userId?: string, tx?: TransactionClient): Promise<ApiProviderWithModels | null> {
    const where: Record<string, unknown> = { id };
    if (userId) where.userId = userId;
    
    return this.getDelegate(tx).findFirst({
      where,
      include: {
        models: true,
      },
    }) as Promise<ApiProviderWithModels | null>;
  }

  /**
   * Find active providers by provider type
   */
  async findByProviderType(userId: string, provider: string, tx?: TransactionClient): Promise<ApiProviderWithModels[]> {
    return this.getDelegate(tx).findMany({
      where: {
        userId,
        provider: toProviderType(provider),
        isActive: true,
        revokedAt: null,
      },
      include: {
        models: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as Promise<ApiProviderWithModels[]>;
  }

  /**
   * Update an API provider
   */
  override async update(id: string, data: UpdateApiProviderInput, userId?: string, tx?: TransactionClient): Promise<ApiProviderWithModels> {
    const where: Record<string, unknown> = { id };
    if (userId) where.userId = userId;

    return this.getDelegate(tx).update({
      where,
      data,
      include: {
        models: true,
      },
    }) as Promise<ApiProviderWithModels>;
  }

  /**
   * Update last used timestamp and IP
   */
  async updateLastUsed(id: string, ipAddress?: string, tx?: TransactionClient): Promise<ApiProvider> {
    return this.getDelegate(tx).update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
        ...(ipAddress ? { lastUsedIp: ipAddress } : {}),
      },
    }) as Promise<ApiProvider>;
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string, ipAddress?: string, tx?: TransactionClient): Promise<ApiProvider> {
    return this.getDelegate(tx).update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        ...(ipAddress ? { lastUsedIp: ipAddress } : {}),
      },
    }) as Promise<ApiProvider>;
  }

  /**
   * Delete an API provider
   */
  override async delete(id: string, userId?: string, tx?: TransactionClient): Promise<ApiProviderWithModels> {
    const provider = await this.findById(id, userId, tx);
    if (!provider) {
      throw new RecordNotFoundError('ApiProvider', id, 'delete');
    }

    await this.getDelegate(tx).delete({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
    });

    return provider;
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string, userId: string, isActive: boolean, tx?: TransactionClient): Promise<ApiProvider> {
    return this.getDelegate(tx).update({
      where: {
        id,
        userId,
      },
      data: {
        isActive,
      },
    }) as Promise<ApiProvider>;
  }

  /**
   * Count active providers for a user
   */
  async countActive(userId: string, tx?: TransactionClient): Promise<number> {
    return this.getDelegate(tx).count({
      where: {
        userId,
        isActive: true,
        revokedAt: null,
      },
    });
  }
}

export const apiProviderRepository = new ApiProviderRepository();
