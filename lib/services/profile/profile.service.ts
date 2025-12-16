import { ProfileRepository, profileRepository } from '@/lib/repositories/profile.repository';
import { profileCache } from '@/lib/cache/simple-cache';
import type { Resume } from '@/lib/validations/jsonresume';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, NotFoundError, ConflictError } from '@/lib/services/utils';
import type { IProfileService } from '../interfaces';
import type { ICache } from '@/lib/repositories/interfaces';

import { getProfileCacheKey, getUserProfilesCacheKey, invalidateProfileCache } from './cache';
import type { Profile, ProfileList } from './types';

/**
 * Profile Service
 *
 * Implements IProfileService for business logic.
 * Uses constructor injection for dependencies.
 */
export class ProfileService implements IProfileService {
  constructor(
    private readonly repository: ProfileRepository = profileRepository,
    private readonly cache: ICache = profileCache
  ) {}

  /**
   * Get all profiles for a user
   */
  async getProfiles(userId: string): Promise<ServiceResult<ProfileList>> {
    return withServiceError('fetch profiles', async () => {
      const cacheKey = getUserProfilesCacheKey(userId);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as ProfileList;
      }

      const profiles = await this.repository.findAllByUserId(userId);

      if (profiles) {
        this.cache.set(cacheKey, profiles);
      }

      return profiles;
    });
  }

  /**
   * Get a specific profile by ID
   */
  async getProfileById(profileId: string, userId: string): Promise<ServiceResult<NonNullable<Profile>>> {
    return withServiceError('fetch profile', async () => {
      const cacheKey = getProfileCacheKey(profileId);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as NonNullable<Profile>;
      }

      const profile = await this.repository.findById(profileId, userId);

      if (!profile) {
        throw new NotFoundError('Profile');
      }

      this.cache.set(cacheKey, profile);

      return profile;
    });
  }

  /**
   * Get default profile for a user (for backward compatibility)
   */
  async getProfile(userId: string): Promise<ServiceResult<Profile>> {
    return withServiceError('fetch default profile', async () => {
      return await this.repository.findDefaultByUserId(userId);
    });
  }

  /**
   * Create a new profile
   */
  async createProfile(
    userId: string,
    name: string,
    data: Resume,
    isDefault: boolean = false
  ): Promise<ServiceResult<NonNullable<Profile>>> {
    return withServiceError('create profile', async () => {
      if (isDefault) {
        await this.repository.unsetAllDefaults(userId);
      }

      const profile = await this.repository.create({
        userId,
        name,
        resume: data,
        isDefault,
      });

      invalidateProfileCache({ cache: this.cache, userId });

      return profile;
    });
  }

  /**
   * Update a profile
   */
  async updateProfile(
    profileId: string,
    userId: string,
    data: Partial<{ name: string; resume: Resume; isDefault: boolean; selectedTemplateId: string | null }>
  ): Promise<ServiceResult<NonNullable<Profile>>> {
    return withServiceError('update profile', async () => {
      const existing = await this.repository.findById(profileId, userId);
      if (!existing) {
        throw new NotFoundError('Profile');
      }

      if (data.isDefault) {
        await this.repository.unsetAllDefaults(userId);
      }

      const profile = await this.repository.update(profileId, userId, data);

      invalidateProfileCache({ cache: this.cache, userId, profileId });

      return profile;
    });
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('delete profile', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) {
        throw new NotFoundError('Profile');
      }

      const allProfiles = await this.repository.findAllByUserId(userId);
      if (allProfiles.length <= 1) {
        throw new ConflictError('Cannot delete your last profile');
      }

      if (profile.isDefault) {
        const otherProfile = allProfiles.find(p => p.id !== profileId);
        if (otherProfile) {
          await this.repository.update(otherProfile.id, userId, { isDefault: true });
        }
      }

      await this.repository.delete(profileId, userId);

      invalidateProfileCache({ cache: this.cache, userId, profileId });
    });
  }

  /**
   * Set a profile as default
   */
  async setDefaultProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('set default profile', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) {
        throw new NotFoundError('Profile');
      }

      await this.repository.unsetAllDefaults(userId);
      await this.repository.update(profileId, userId, { isDefault: true });

      invalidateProfileCache({ cache: this.cache, userId });
    });
  }

  /**
   * Duplicate a profile
   */
  async duplicateProfile(
    profileId: string,
    userId: string,
    newName?: string
  ): Promise<ServiceResult<NonNullable<Profile>>> {
    return withServiceError('duplicate profile', async () => {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) {
        throw new NotFoundError('Profile');
      }

      const duplicateName = newName || `${profile.name} (Copy)`;

      const newProfile = await this.repository.create({
        userId,
        name: duplicateName,
        resume: profile.resume as Resume,
        isDefault: false,
      });

      invalidateProfileCache({ cache: this.cache, userId });

      return newProfile;
    });
  }
}

export const profileService = new ProfileService();
