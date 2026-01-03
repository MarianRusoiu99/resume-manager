/**
 * API Provider Repository
 * Handles database operations for API provider management
 */

import { prisma } from '@/lib/db/index';
import { PrismaClient, ProviderType, ApiProvider, ApiModel } from '@prisma/client';
import { GenericUserOwnedRepository } from './generic.repository';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TPrismaDelegate requires dynamic Prisma types
  extends GenericUserOwnedRepository<ApiProviderWithModels, CreateApiProviderInput, UpdateApiProviderInput, any>
  implements IApiProviderRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('apiProvider', dbClient);
  }

  /**
   * Create a new API provider
   */
  override async create(data: CreateApiProviderInput): Promise<ApiProviderWithModels> {
    return this.db.apiProvider.create({
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
    });
  }

  /**
   * Find all API providers for a user
   */
  async findByUserId(userId: string, includeInactive = false): Promise<ApiProviderWithModels[]> {
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
    });
  }

  /**
   * Find a specific API provider by ID
   */
  override async findById(id: string, userId?: string): Promise<ApiProviderWithModels | null> {
    return this.db.apiProvider.findFirst({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
      include: {
        models: true,
      },
    });
  }

  /**
   * Find active providers by provider type
   */
  async findByProviderType(userId: string, provider: string): Promise<ApiProviderWithModels[]> {
    return this.db.apiProvider.findMany({
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
    });
  }

  /**
   * Update an API provider
   */
  override async update(id: string, data: UpdateApiProviderInput, userId?: string): Promise<ApiProviderWithModels> {
    return this.db.apiProvider.update({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
      data,
      include: {
        models: true,
      },
    });
  }

  /**
   * Update last used timestamp and IP
   */
  async updateLastUsed(id: string, ipAddress?: string): Promise<ApiProvider> {
    return this.db.apiProvider.update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
        ...(ipAddress ? { lastUsedIp: ipAddress } : {}),
      },
    });
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string, ipAddress?: string): Promise<ApiProvider> {
    return this.db.apiProvider.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        ...(ipAddress ? { lastUsedIp: ipAddress } : {}),
      },
    });
  }

  /**
   * Delete an API provider
   */
  override async delete(id: string, userId?: string): Promise<ApiProviderWithModels> {
    const provider = await this.findById(id, userId);
    if (!provider) throw new Error('API Provider not found');

    await this.db.apiProvider.delete({
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
  async toggleActive(id: string, userId: string, isActive: boolean): Promise<ApiProvider> {
    return this.db.apiProvider.update({
      where: {
        id,
        userId,
      },
      data: {
        isActive,
      },
    });
  }

  /**
   * Count active providers for a user
   */
  async countActive(userId: string): Promise<number> {
    return this.db.apiProvider.count({
      where: {
        userId,
        isActive: true,
        revokedAt: null,
      },
    });
  }
}

export const apiProviderRepository = new ApiProviderRepository();
