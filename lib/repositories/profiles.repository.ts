import { prisma } from '@/lib/db/index';
import { PrismaClient, Prisma } from '@prisma/client';
import { GenericUserOwnedRepository, PrismaArgs } from './generic.repository';
import type { IProfileRepository, ProfileData, CreateProfileInput, UpdateProfileInput, ProfileWithTemplate, ProfileFindOptions } from './interfaces/profiles.repository.interface';
import type { Resume } from '@/lib/validations/jsonresume';
import { TransactionClient } from '@/lib/db/transaction';

// Remove local ProfileFindOptions as it's now exported from the interface file

/**
 * Profile with document relation from Prisma
 */
type ProfileWithDocument = Prisma.ProfileGetPayload<{
  include: { document: { select: { document: true } } };
}>;

/**
 * Profile Repository
 *
 * Refactored to use GenericUserOwnedRepository.
 */
export class ProfileRepository extends GenericUserOwnedRepository<
  ProfileData,
  CreateProfileInput,
  UpdateProfileInput,
  'profile',
  Prisma.ProfileDelegate
> implements IProfileRepository {
  
  constructor(dbClient: PrismaClient = prisma) {
    super('profile', dbClient);
  }

  private mapProfile(profile: ProfileWithDocument | Prisma.ProfileGetPayload<{}>): ProfileData {
    const hasDocument = 'document' in profile && profile.document;
    
    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      resume: hasDocument ? ((profile.document?.document as unknown) as Resume) : null,
      isDefault: profile.isDefault,
      isPublic: profile.isPublic,
      publicSlug: profile.publicSlug,
      selectedTemplateId: profile.selectedTemplateId,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async findAllByUserId(userId: string, options?: ProfileFindOptions, tx?: TransactionClient): Promise<ProfileData[]> {
    const { limit = 100, offset = 0, includeDocument = true } = options || {};

    const profiles = await this.getDelegate(tx).findMany({
      where: { userId },
      include: includeDocument ? { document: { select: { document: true } } } : undefined,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    });
    return (profiles as unknown as ProfileWithDocument[]).map((p) => this.mapProfile(p));
  }

  override async findById(profileId: string, userId?: string, tx?: TransactionClient): Promise<ProfileData | null> {
    const profile = await this.getDelegate(tx).findFirst({
      where: { id: profileId, ...(userId ? { userId } : {}) },
      include: { document: { select: { document: true } } }
    });
    
    return profile ? this.mapProfile(profile as unknown as ProfileWithDocument) : null;
  }

  async findDefaultByUserId(userId: string, tx?: TransactionClient): Promise<ProfileData | null> {
    const profile = await this.getDelegate(tx).findFirst({
      where: { userId, isDefault: true },
      include: { document: { select: { document: true } } }
    });
    return profile ? this.mapProfile(profile as unknown as ProfileWithDocument) : null;
  }

  async findByUserId(userId: string, tx?: TransactionClient): Promise<ProfileData | null> {
    return this.findDefaultByUserId(userId, tx);
  }

  // Custom create to handle document relation
  override async create(data: CreateProfileInput, tx?: TransactionClient): Promise<ProfileData> {
    const created = await this.getDelegate(tx).create({
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
    return this.mapProfile(created as unknown as ProfileWithDocument);
  }

  // Custom update to handle document relation
  override async update(profileId: string, data: UpdateProfileInput, userId?: string, tx?: TransactionClient): Promise<ProfileData> {
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

    const updated = await this.getDelegate(tx).update({
      where: { id: profileId, ...(userId ? { userId } : {}) },
      data: updateData,
      include: { document: { select: { document: true } } },
    });

    return this.mapProfile(updated as unknown as ProfileWithDocument);
  }

  // Custom delete to include document
  override async delete(profileId: string, userId?: string, tx?: TransactionClient): Promise<ProfileData> {
    const deleted = await this.getDelegate(tx).delete({
      where: { id: profileId, ...(userId ? { userId } : {}) },
      include: { document: { select: { document: true } } },
    });
    return this.mapProfile(deleted as unknown as ProfileWithDocument);
  }

  async unsetAllDefaults(userId: string, tx?: TransactionClient) {
    return this.getDelegate(tx).updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // Implementation of IProfileRepository interface methods
  async profileExists(userId: string, tx?: TransactionClient): Promise<boolean> {
    const count = await this.count(userId, tx);
    return count > 0;
  }

  async profileCount(userId: string, tx?: TransactionClient): Promise<number> {
    return this.count(userId, tx);
  }

  override async count(whereOrUserId?: Record<string, unknown> | string, tx?: TransactionClient): Promise<number> {
    return super.count(whereOrUserId, tx);
  }

  async findByPublicSlug(slug: string, tx?: TransactionClient): Promise<ProfileWithTemplate | null> {
    const profile = await this.getDelegate(tx).findUnique({
      where: { publicSlug: slug },
      include: {
        document: { select: { document: true } },
        selectedTemplate: { select: { id: true, name: true, htmlTemplate: true } },
      },
    });

    if (!profile) return null;

    const mapped = this.mapProfile(profile as unknown as ProfileWithDocument);
    const p = profile as unknown as Prisma.ProfileGetPayload<{
      include: {
        document: { select: { document: true } };
        selectedTemplate: { select: { id: true; name: true; htmlTemplate: true } };
      };
    }>;
    return {
      ...mapped,
      selectedTemplate: p.selectedTemplate
        ? {
            id: p.selectedTemplate.id,
            name: p.selectedTemplate.name,
            htmlTemplate: p.selectedTemplate.htmlTemplate,
          }
        : null,
    };
  }
}

export const profileRepository = new ProfileRepository();
