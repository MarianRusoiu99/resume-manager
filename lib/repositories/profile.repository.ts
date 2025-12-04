import { prisma } from "@/lib/db";
import type { Resume } from "@/lib/validations/jsonresume";

export class ProfileRepository {
  /**
   * Find all profiles for a user
   */
  async findAllByUserId(userId: string) {
    return prisma.userProfile.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' }, // Default profile first
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Find a specific profile by ID (with user ownership check)
   */
  async findById(profileId: string, userId: string) {
    return prisma.userProfile.findFirst({
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
    return prisma.userProfile.findFirst({
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
    return prisma.userProfile.create({
      data: {
        userId: data.userId,
        name: data.name,
        resume: data.resume as never,
        isDefault: data.isDefault ?? false,
      },
    });
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
  // selectedTemplateId removed (dropped from schema)
    }>
  ) {
    return prisma.userProfile.update({
      where: {
        id: profileId,
        userId,
      },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.resume && { resume: data.resume as never }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.publicSlug !== undefined && { publicSlug: data.publicSlug }),
  // selectedTemplateId removed
      },
    });
  }

  /**
   * Delete a profile
   */
  async delete(profileId: string, userId: string) {
    return prisma.userProfile.delete({
      where: {
        id: profileId,
        userId,
      },
    });
  }

  /**
   * Unset all default flags for a user
   */
  async unsetAllDefaults(userId: string) {
    return prisma.userProfile.updateMany({
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
    const count = await prisma.userProfile.count({
      where: { userId },
    });
    return count > 0;
  }

  /**
   * Get profile count for a user
   */
  async count(userId: string): Promise<number> {
    return prisma.userProfile.count({
      where: { userId },
    });
  }

  /**
   * Find profile by public slug (for public sharing)
   * Includes the selected template for rendering
   */
  async findByPublicSlug(slug: string) {
    return prisma.userProfile.findUnique({
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
