import { PrismaClient, APIKey } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Repository for managing API keys in the database
 */
export class APIKeyRepository {
  private db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Find all API keys for a user
   */
  async findByUserId(userId: string): Promise<APIKey[]> {
    return this.db.aPIKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find a specific API key by ID
   */
  async findById(id: string): Promise<APIKey | null> {
    return this.db.aPIKey.findUnique({
      where: { id }
    });
  }

  /**
   * Find an API key by ID and user ID (ensures ownership)
   */
  async findByIdAndUserId(id: string, userId: string): Promise<APIKey | null> {
    return this.db.aPIKey.findFirst({
      where: { id, userId }
    });
  }

  /**
   * Find active API keys for a user and provider
   */
  async findActiveByUserAndProvider(
    userId: string,
    provider: string
  ): Promise<APIKey[]> {
    return this.db.aPIKey.findMany({
      where: {
        userId,
        provider,
        isActive: true
      },
      orderBy: { lastUsedAt: 'desc' }
    });
  }

  /**
   * Create a new API key
   */
  async create(data: {
    userId: string;
    provider: string;
    encryptedKey: string;
    keyHash: string;
    isActive?: boolean;
  }): Promise<APIKey> {
    return this.db.aPIKey.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        encryptedKey: data.encryptedKey,
        keyHash: data.keyHash,
        isActive: data.isActive ?? true,
        lastUsedAt: null
      }
    });
  }

  /**
   * Update an API key
   */
  async update(
    id: string,
    data: {
      isActive?: boolean;
      encryptedKey?: string;
      keyHash?: string;
    }
  ): Promise<APIKey> {
    return this.db.aPIKey.update({
      where: { id },
      data
    });
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(id: string): Promise<APIKey> {
    return this.db.aPIKey.update({
      where: { id },
      data: { lastUsedAt: new Date() }
    });
  }

  /**
   * Deactivate an API key (soft delete)
   */
  async deactivate(id: string): Promise<APIKey> {
    return this.db.aPIKey.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Delete an API key (hard delete)
   */
  async delete(id: string): Promise<void> {
    await this.db.aPIKey.delete({
      where: { id }
    });
  }

  /**
   * Delete all API keys for a user
   */
  async deleteByUserId(userId: string): Promise<void> {
    await this.db.aPIKey.deleteMany({
      where: { userId }
    });
  }

  /**
   * Check if a user has any active API keys for a provider
   */
  async hasActiveKey(userId: string, provider: string): Promise<boolean> {
    const count = await this.db.aPIKey.count({
      where: {
        userId,
        provider,
        isActive: true
      }
    });
    return count > 0;
  }

  /**
   * Count API keys for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.db.aPIKey.count({
      where: { userId }
    });
  }
}

// Export a singleton instance
export const apiKeyRepository = new APIKeyRepository();
