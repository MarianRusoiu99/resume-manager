import { profileRepository, ProfileRepository } from '@/lib/repositories/profiles.repository';
import { profileCache } from '@/lib/cache/simple-cache';
import { type Resume, resumeSchema } from '@/lib/validations/jsonresume';
import { type ServiceResult } from '@/lib/types';
import { withServiceError, NotFoundError, ConflictError, GenericUserOwnedCrudService } from '@/lib/services/utils';
import type { IProfileService, ProfileServiceData, UpdateProfileServiceInput } from '../interfaces';
import { invalidateProfileCache } from './cache';
import { withTransaction } from '@/lib/db/transaction';
import { Prisma } from '@prisma/client';

import type { ProfileData, CreateProfileInput, UpdateProfileInput, ICache } from '@/lib/repositories/interfaces';

/**
 * Profile Service
 *
 * Refactored to use GenericUserOwnedCrudService.
 */
export class ProfileService extends GenericUserOwnedCrudService<
  ProfileData,
  CreateProfileInput,
  UpdateProfileInput,
  Record<string, unknown>,
  ProfileRepository
> implements IProfileService {
  
  constructor(
    repository: ProfileRepository = profileRepository,
    cache: ICache = profileCache
  ) {
    super(repository, 'Profile', cache);
  }

  private mapToServiceData(data: ProfileData): ProfileServiceData {
    return {
      ...data,
      resume: data.resume as Resume,
      templateId: data.selectedTemplateId ?? null,
      selectedTemplateId: data.selectedTemplateId ?? null,
    };
  }

  async getProfiles(userId: string): Promise<ServiceResult<ProfileServiceData[]>> {
    return withServiceError('fetch profiles', async () => {
      const profiles = await this.repository.findAllByUserId(userId);
      return profiles.map((p) => this.mapToServiceData(p));
    });
  }

  async getProfileById(profileId: string, userId: string): Promise<ServiceResult<ProfileServiceData>> {
    return withServiceError('fetch profile by id', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) throw new NotFoundError('Profile not found');
      return this.mapToServiceData(profile);
    });
  }

  async getProfile(userId: string): Promise<ServiceResult<ProfileServiceData | null>> {
    return withServiceError('fetch default profile', async () => {
      const profile = await this.repository.findDefaultByUserId(userId);
      return profile ? this.mapToServiceData(profile) : null;
    });
  }

  async createProfile(
    userId: string,
    name: string,
    data: Resume,
    isDefault: boolean = false
  ): Promise<ServiceResult<ProfileServiceData>> {
    return withServiceError('create profile', async () => {
      resumeSchema.parse(data);

      if (isDefault) {
        const profile = await withTransaction(async (tx) => {
          await this.repository.unsetAllDefaults(userId, tx);

          return this.repository.create({
            userId,
            name,
            resume: data,
            isDefault: true,
          }, tx);
        });

        await invalidateProfileCache({ cache: this.cache!, userId });
        return this.mapToServiceData(profile);
      }

      const profile = await this.repository.create({
        userId,
        name,
        resume: data,
        isDefault,
      });

      await invalidateProfileCache({ cache: this.cache!, userId });
      return this.mapToServiceData(profile);
    });
  }

  async updateProfile(
    profileId: string,
    userId: string,
    data: UpdateProfileServiceInput
  ): Promise<ServiceResult<ProfileServiceData>> {
    return withServiceError('update profile', async () => {
      if (data.resume) {
        resumeSchema.parse(data.resume);
      }

      if (data.isDefault) {
        const profile = await withTransaction(async (tx) => {
          await this.repository.unsetAllDefaults(userId, tx);

          return this.repository.update(profileId, {
            ...data,
            isDefault: true,
          }, userId, tx);
        });

        await invalidateProfileCache({ cache: this.cache!, userId, profileId });
        return this.mapToServiceData(profile);
      }

      const profile = await this.repository.update(profileId, data, userId);

      await invalidateProfileCache({ cache: this.cache!, userId, profileId });

      return this.mapToServiceData(profile);
    });
  }

  async deleteProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('delete profile', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) throw new NotFoundError('Profile not found');

      const count = await this.repository.count(userId);
      if (count <= 1) {
        throw new ConflictError('Cannot delete your last profile');
      }

      await withTransaction(async (tx) => {
        if (profile.isDefault) {
          const profiles = await this.repository.findAllByUserId(userId, { limit: 2 }, tx);
          const otherProfile = profiles.find(p => p.id !== profileId);
          
          if (otherProfile) {
            await this.repository.update(otherProfile.id, { isDefault: true }, userId, tx);
          }
        }

        await this.repository.delete(profileId, userId, tx);
      });

      await invalidateProfileCache({ cache: this.cache!, userId, profileId });
    });
  }

  async setDefaultProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('set default profile', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) throw new NotFoundError('Profile not found');

      await withTransaction(async (tx) => {
        await this.repository.unsetAllDefaults(userId, tx);
        await this.repository.update(profileId, { isDefault: true }, userId, tx);
      });

      await invalidateProfileCache({ cache: this.cache!, userId });
    });
  }

  async duplicateProfile(
    profileId: string,
    userId: string,
    newName?: string
  ): Promise<ServiceResult<ProfileServiceData>> {
    return withServiceError('duplicate profile', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) throw new NotFoundError('Profile not found');

      const duplicateName = newName || `${profile.name} (Copy)`;

      const newProfile = await this.repository.create({
        userId,
        name: duplicateName,
        resume: profile.resume as Resume,
        isDefault: false,
      });

      await invalidateProfileCache({ cache: this.cache!, userId });

      return this.mapToServiceData(newProfile);
    });
  }
}

export const profileService = new ProfileService();
