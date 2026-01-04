import { prisma } from '@/lib/db/index';
import { PrismaClient, Prisma } from '@prisma/client';
import { GenericUserOwnedRepository, PrismaArgs } from './generic.repository';
import type { IProfileRepository, ProfileData, CreateProfileInput, UpdateProfileInput, ProfileWithTemplate } from './interfaces/profiles.repository.interface';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Profile with document relation from Prisma
 */
type ProfileWithDocument = Prisma.ProfileGetPayload<{
  include: { document: { select: { document: true } } };
}>;

/**
 * Prisma delegate type for Profile model
 */
type ProfilePrismaDelegate = {
  findUnique(args: { where: Record<string, unknown>; include?: unknown; select?: unknown }): Promise<unknown>;
  findFirst(args: { where: Record<string, unknown>; include?: unknown; select?: unknown; orderBy?: unknown }): Promise<unknown>;
  findMany(args?: PrismaArgs): Promise<unknown[]>;
  create(args: { data: CreateProfileInput; include?: unknown; select?: unknown }): Promise<unknown>;
  update(args: { where: Record<string, unknown>; data: UpdateProfileInput; include?: unknown; select?: unknown }): Promise<unknown>;
  delete(args: { where: Record<string, unknown>; include?: unknown; select?: unknown }): Promise<unknown>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
};

/**
 * Profile Repository
 *
 * Refactored to use GenericUserOwnedRepository.
 */
export class ProfileRepository extends GenericUserOwnedRepository<
  ProfileData,
  CreateProfileInput,
  UpdateProfileInput,
  ProfilePrismaDelegate
> implements IProfileRepository {
  
  constructor(dbClient: PrismaClient = prisma) {
    super('profile', dbClient);
  }

  private mapProfile(profile: ProfileWithDocument): ProfileData {
    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      resume: (profile.document?.document as Resume) ?? null,
      isDefault: profile.isDefault,
      isPublic: profile.isPublic,
      publicSlug: profile.publicSlug,
      selectedTemplateId: profile.selectedTemplateId,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async findAllByUserId(userId: string): Promise<ProfileData[]> {
    const profiles = await this.db.profile.findMany({
      where: { userId },
      include: { document: { select: { document: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return profiles.map(p => this.mapProfile(p));
  }

  override async findById(profileId: string, userId?: string): Promise<ProfileData | null> {
    const profile = await this.db.profile.findFirst({
      where: { id: profileId, ...(userId ? { userId } : {}) },
      include: { document: { select: { document: true } } }
    });
    
    return profile ? this.mapProfile(profile) : null;
  }

  async findDefaultByUserId(userId: string): Promise<ProfileData | null> {
    const profile = await this.db.profile.findFirst({
      where: { userId, isDefault: true },
      include: { document: { select: { document: true } } }
    });
    return profile ? this.mapProfile(profile) : null;
  }

  async findByUserId(userId: string): Promise<ProfileData | null> {
    return this.findDefaultByUserId(userId);
  }

  // Custom create to handle document relation
  override async create(data: CreateProfileInput): Promise<ProfileData> {
    const created = await this.db.profile.create({
      data: {
        userId: data.userId,
        name: data.name,
        isDefault: data.isDefault ?? false,
        document: {
          create: {
            document: data.resume as Prisma.InputJsonValue,
          },
        },
      },
      include: { document: { select: { document: true } } },
    });
    return this.mapProfile(created);
  }

  // Custom update to handle document relation
  override async update(profileId: string, data: UpdateProfileInput, userId?: string): Promise<ProfileData> {
    const updateData: Prisma.ProfileUpdateInput = {
      ...(data.name === undefined ? {} : { name: data.name }),
      ...(data.isDefault === undefined ? {} : { isDefault: data.isDefault }),
      ...(data.isPublic === undefined ? {} : { isPublic: data.isPublic }),
      ...(data.publicSlug === undefined ? {} : { publicSlug: data.publicSlug }),
      ...(data.selectedTemplateId === undefined ? {} : { selectedTemplateId: data.selectedTemplateId }),
      ...(data.resume === undefined
        ? {}
        : {
            document: {
              upsert: {
                create: { document: data.resume as Prisma.InputJsonValue },
                update: { document: data.resume as Prisma.InputJsonValue, updatedAt: new Date() },
              },
            },
          }),
    };

    const updated = await this.db.profile.update({
      where: { id: profileId, ...(userId ? { userId } : {}) },
      data: updateData,
      include: { document: { select: { document: true } } },
    });

    return this.mapProfile(updated);
  }

  // Custom delete to include document
  override async delete(profileId: string, userId?: string): Promise<ProfileData> {
    const deleted = await this.db.profile.delete({
      where: { id: profileId, ...(userId ? { userId } : {}) },
      include: { document: { select: { document: true } } },
    });
    return this.mapProfile(deleted);
  }

  async unsetAllDefaults(userId: string) {
    return this.db.profile.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async profileExists(userId: string): Promise<boolean> {
    const count = await this.db.profile.count({ where: { userId } });
    return count > 0;
  }

  async profileCount(userId: string): Promise<number> {
    return this.db.profile.count({ where: { userId } });
  }

  // Implementation of IProfileRepository interface methods
  async exists(userId: string): Promise<boolean> {
    return this.profileExists(userId);
  }

  // Note: This matches IProfileRepository.count(userId: string)
  // but conflicts with GenericRepository.count(where?: Record<string, unknown>)
  // We need to use a different name in the class or cast
  override async count(whereOrUserId?: Record<string, unknown> | string): Promise<number> {
    if (typeof whereOrUserId === 'string') {
      return this.db.profile.count({ where: { userId: whereOrUserId } });
    }
    return super.count(whereOrUserId);
  }

  async findByPublicSlug(slug: string): Promise<ProfileWithTemplate | null> {
    const profile = await this.db.profile.findUnique({
      where: { publicSlug: slug },
      include: {
        document: { select: { document: true } },
        selectedTemplate: { select: { id: true, name: true, htmlTemplate: true } },
      },
    });

    if (!profile) return null;

    const mapped = this.mapProfile(profile);
    return {
      ...mapped,
      selectedTemplate: profile.selectedTemplate
        ? {
            id: profile.selectedTemplate.id,
            name: profile.selectedTemplate.name,
            htmlTemplate: profile.selectedTemplate.htmlTemplate,
          }
        : null,
    };
  }
}

export const profileRepository = new ProfileRepository();
