import { prisma } from '@/lib/db';
import { PrismaClient, Prisma } from '@prisma/client';
import type { Resume } from '@/lib/validations/jsonresume';

import { PrismaUserOwnedCrudRepository } from './base.repository';
import type { IProfileRepository } from './interfaces';

type ProfileEntity = Prisma.UserProfileGetPayload<object>;

/**
 * Profile Repository
 *
 * Implements IProfileRepository for data access abstraction.
 * Allows dependency injection of database client for testing.
 */
export class ProfileRepository
  extends PrismaUserOwnedCrudRepository<
    ProfileEntity,
    {
      userId: string;
      name: string;
      resume: Resume;
      isDefault?: boolean;
    },
    Partial<{
      name: string;
      resume: Resume;
      isDefault: boolean;
      isPublic: boolean;
      publicSlug: string | null;
      selectedTemplateId: string | null;
    }>
  >
  implements IProfileRepository
{
  protected readonly model = 'userProfile';

  constructor(dbClient: PrismaClient = prisma) {
    super(dbClient);
  }

  protected override buildCreateData(input: {
    userId: string;
    name: string;
    resume: Resume;
    isDefault?: boolean;
  }): Record<string, unknown> {
    return {
      userId: input.userId,
      name: input.name,
      resume: input.resume as Prisma.InputJsonValue,
      isDefault: input.isDefault ?? false,
    };
  }

  protected override buildUpdateData(
    input: Partial<{
      name: string;
      resume: Resume;
      isDefault: boolean;
      isPublic: boolean;
      publicSlug: string | null;
      selectedTemplateId: string | null;
    }>
  ): Record<string, unknown> {
    return {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.resume !== undefined && { resume: input.resume as Prisma.InputJsonValue }),
      ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      ...(input.publicSlug !== undefined && { publicSlug: input.publicSlug }),
      ...(input.selectedTemplateId !== undefined && { templateId: input.selectedTemplateId }),
    };
  }

  /**
   * Find all profiles for a user
   */
  async findAllByUserId(userId: string) {
    return this.db.userProfile.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Find a specific profile by ID (with user ownership check)
   */
  async findById(profileId: string, userId: string) {
    return this.db.userProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });
  }

  /**
   * Find default profile for a user
   */
  async findDefaultByUserId(userId: string) {
    return this.db.userProfile.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  /**
   * Find by userId (for backward compatibility - returns first/default profile)
   */
  async findByUserId(userId: string) {
    return this.findDefaultByUserId(userId);
  }

  /**
   * Create a new profile
   */
  async create(data: {
    userId: string;
    name: string;
    resume: Resume;
    isDefault?: boolean;
  }) {
    return super.create(data);
  }

  /**
   * Update a profile
   */
  async update(
    profileId: string,
    userId: string,
    data: Partial<{
      name: string;
      resume: Resume;
      isDefault: boolean;
      isPublic: boolean;
      publicSlug: string | null;
      selectedTemplateId: string | null;
    }>
  ) {
    const updated = await super.update(profileId, userId, data);
    if (!updated) {
      throw new Error('Profile not found');
    }

    return updated;
  }

  /**
   * Delete a profile
   */
  async delete(profileId: string, userId: string) {
    const deleted = await super.delete(profileId, userId);
    if (!deleted) {
      throw new Error('Profile not found');
    }

    return deleted;
  }

  /**
   * Unset all default flags for a user
   */
  async unsetAllDefaults(userId: string) {
    return this.db.userProfile.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }

  /**
   * Check if user has any profiles
   */
  async exists(userId: string): Promise<boolean> {
    const count = await this.db.userProfile.count({
      where: { userId },
    });
    return count > 0;
  }

  /**
   * Get profile count for a user
   */
  async count(userId: string): Promise<number> {
    return this.db.userProfile.count({
      where: { userId },
    });
  }

  /**
   * Find profile by public slug (for public sharing)
   * Includes the selected template for rendering
   */
  async findByPublicSlug(slug: string) {
    return this.db.userProfile.findUnique({
      where: {
        publicSlug: slug,
      },
      include: {
        selectedTemplate: true,
      },
    });
  }
}

export const profileRepository = new ProfileRepository();
