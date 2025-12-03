/**
 * API Provider Repository
 * Handles database operations for API provider management
 */

import { prisma } from '@/lib/db';

export interface CreateApiProviderInput {
  userId: string;
  name: string;
  provider: string;
  encryptedKey: string;
  models: string[];
}

export interface UpdateApiProviderInput {
  name?: string;
  encryptedKey?: string;
  isActive?: boolean;
  lastUsedAt?: Date;
  keyVersion?: number;
  revokedAt?: Date;
  scopes?: string[];
}

class ApiProviderRepository {
  /**
   * Create a new API provider
   */
  async create(data: CreateApiProviderInput) {
    return prisma.apiProvider.create({
      data: {
        ...data,
        provider: data.provider.toUpperCase() as 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'COHERE' | 'MISTRAL',
      },
    });
  }

  /**
   * Find all API providers for a user
   */
  async findByUserId(userId: string, includeInactive = false) {
    return prisma.apiProvider.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true, revokedAt: null }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find a specific API provider by ID
   */
  async findById(id: string, userId: string) {
    return prisma.apiProvider.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Find active providers by provider type
   */
  async findByProviderType(userId: string, provider: string) {
    return prisma.apiProvider.findMany({
      where: {
        userId,
        provider: provider.toUpperCase() as 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'COHERE' | 'MISTRAL',
        isActive: true,
        revokedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update an API provider
   */
  async update(id: string, userId: string, data: UpdateApiProviderInput) {
    return prisma.apiProvider.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });
  }

  /**
   * Update last used timestamp and IP
   */
  async updateLastUsed(id: string, ipAddress?: string) {
    return prisma.apiProvider.update({
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
  async incrementUsage(id: string, ipAddress?: string) {
    return prisma.apiProvider.update({
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
  async delete(id: string, userId: string) {
    return prisma.apiProvider.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string, userId: string, isActive: boolean) {
    return prisma.apiProvider.updateMany({
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
  async countActive(userId: string) {
    return prisma.apiProvider.count({
      where: {
        userId,
        isActive: true,
        revokedAt: null,
      },
    });
  }
}

export const apiProviderRepository = new ApiProviderRepository();
