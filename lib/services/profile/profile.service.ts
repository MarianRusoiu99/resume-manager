import { profileRepository, ProfileRepository } from '@/lib/repositories/profile.repository';
import { profileCache } from '@/lib/cache/simple-cache';
import { type Resume, resumeSchema } from '@/lib/validations/jsonresume';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, ConflictError, GenericUserOwnedCrudService } from '@/lib/services/utils';
import type { IProfileService, ProfileServiceData, UpdateProfileServiceInput } from '../interfaces';
import { invalidateProfileCache } from './cache';

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
      resume: data.resume as any,
      templateId: data.selectedTemplateId ?? null,
      selectedTemplateId: data.selectedTemplateId ?? null,
    };
  }

  async getProfiles(userId: string): Promise<ServiceResult<ProfileServiceData[]>> {
    const result = await this.getAllForUser(userId);
    if (result.success) {
      return {
        success: true,
        data: result.data.map((p: ProfileData) => this.mapToServiceData(p))
      };
    }
    return result as ServiceResult<ProfileServiceData[]>;
  }

  async getProfileById(profileId: string, userId: string): Promise<ServiceResult<ProfileServiceData>> {
    const result = await this.getById(profileId, userId);
    if (result.success) {
      return {
        success: true,
        data: this.mapToServiceData(result.data)
      };
    }
    return result as ServiceResult<ProfileServiceData>;
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
    const result = await withServiceError('create profile', async () => {
      // Validate resume data
      resumeSchema.parse(data);

      if (isDefault) {
        await this.repository.unsetAllDefaults(userId);
      }

      const profile = await this.repository.create({
        userId,
        name,
        resume: data,
        isDefault,
      });

      invalidateProfileCache({ cache: this.cache!, userId });

      return profile;
    });

    if (result.success) {
      return {
        success: true,
        data: this.mapToServiceData(result.data)
      };
    }
    return result as ServiceResult<ProfileServiceData>;
  }

  async updateProfile(
    profileId: string,
    userId: string,
    data: UpdateProfileServiceInput
  ): Promise<ServiceResult<ProfileServiceData>> {
    const result = await withServiceError('update profile', async () => {
      if (data.resume) {
        resumeSchema.parse(data.resume);
      }

      if (data.isDefault) {
        await this.repository.unsetAllDefaults(userId);
      }

      const profile = await this.repository.update(profileId, data, userId);

      invalidateProfileCache({ cache: this.cache!, userId, profileId });

      return profile;
    });

    if (result.success) {
      return {
        success: true,
        data: this.mapToServiceData(result.data)
      };
    }
    return result as ServiceResult<ProfileServiceData>;
  }

  async deleteProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('delete profile', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) throw new ConflictError('Profile not found');

      const count = await this.repository.count(userId);
      if (count <= 1) {
        throw new ConflictError('Cannot delete your last profile');
      }

      if (profile.isDefault) {
        const allProfiles = await this.repository.findAllByUserId(userId);
        const otherProfile = allProfiles.find((p: any) => p.id !== profileId);
        if (otherProfile) {
          await this.repository.update(otherProfile.id, { isDefault: true }, userId);
        }
      }

      await this.repository.delete(profileId, userId);

      invalidateProfileCache({ cache: this.cache!, userId, profileId });
    });
  }

  async setDefaultProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('set default profile', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) throw new ConflictError('Profile not found');

      await this.repository.unsetAllDefaults(userId);
      await this.repository.update(profileId, { isDefault: true }, userId);

      invalidateProfileCache({ cache: this.cache!, userId });
    });
  }

  async duplicateProfile(
    profileId: string,
    userId: string,
    newName?: string
  ): Promise<ServiceResult<ProfileServiceData>> {
    const result = await withServiceError('duplicate profile', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) throw new ConflictError('Profile not found');

      const duplicateName = newName || `${profile.name} (Copy)`;

      const newProfile = await this.repository.create({
        userId,
        name: duplicateName,
        resume: profile.resume as Resume,
        isDefault: false,
      });

      invalidateProfileCache({ cache: this.cache!, userId });

      return newProfile;
    });

    if (result.success) {
      return {
        success: true,
        data: this.mapToServiceData(result.data)
      };
    }
    return result as ServiceResult<ProfileServiceData>;
  }
}

export const profileService = new ProfileService();
