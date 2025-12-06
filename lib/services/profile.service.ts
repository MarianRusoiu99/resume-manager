import { ProfileRepository, profileRepository } from "@/lib/repositories/profile.repository";
import { profileCache } from "@/lib/cache/simple-cache";
import type { Resume } from "@/lib/validations/jsonresume";
import { type ServiceResult } from "@/lib/types/service-result";
import { withServiceError, NotFoundError, ConflictError } from "@/lib/services/utils";
import type { IProfileService } from "./interfaces";
import type { ICache } from "@/lib/repositories/interfaces";

// Type for profile data returned from repository
type Profile = Awaited<ReturnType<typeof profileRepository.findById>>;
type ProfileList = Awaited<ReturnType<typeof profileRepository.findAllByUserId>>;

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

  private getCacheKey(userId: string): string {
    return `profiles:${userId}`;
  }

  private getProfileCacheKey(profileId: string): string {
    return `profile:${profileId}`;
  }

  private invalidateUserCache(userId: string, profileId?: string): void {
    this.cache.delete(this.getCacheKey(userId));
    if (profileId) {
      this.cache.delete(this.getProfileCacheKey(profileId));
    }
  }

  /**
   * Get all profiles for a user
   */
  async getProfiles(userId: string): Promise<ServiceResult<ProfileList>> {
    return withServiceError('fetch profiles', async () => {
      // Check cache first
      const cacheKey = this.getCacheKey(userId);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as ProfileList;
      }

      // Fetch from database
      const profiles = await this.repository.findAllByUserId(userId);

      // Cache the result
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
      // Check cache first
      const cacheKey = this.getProfileCacheKey(profileId);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as NonNullable<Profile>;
      }

      // Fetch from database
      const profile = await this.repository.findById(profileId, userId);

      if (!profile) {
        throw new NotFoundError('Profile');
      }

      // Cache the result
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
      // If this is set as default, unset other defaults
      if (isDefault) {
        await this.repository.unsetAllDefaults(userId);
      }

      // Create profile
      const profile = await this.repository.create({
        userId,
        name,
        resume: data,
        isDefault,
      });

      // Invalidate cache
      this.invalidateUserCache(userId);

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
      // Check if profile exists and belongs to user
      const existing = await this.repository.findById(profileId, userId);
      if (!existing) {
        throw new NotFoundError('Profile');
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await this.repository.unsetAllDefaults(userId);
      }

      // Update profile
      const profile = await this.repository.update(profileId, userId, data);

      // Invalidate cache
      this.invalidateUserCache(userId, profileId);

      return profile;
    });
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('delete profile', async () => {
      // Check if profile exists
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) {
        throw new NotFoundError('Profile');
      }

      // Don't allow deleting the last profile
      const allProfiles = await this.repository.findAllByUserId(userId);
      if (allProfiles.length <= 1) {
        throw new ConflictError('Cannot delete your last profile');
      }

      // If deleting default profile, set another as default
      if (profile.isDefault) {
        const otherProfile = allProfiles.find(p => p.id !== profileId);
        if (otherProfile) {
          await this.repository.update(otherProfile.id, userId, { isDefault: true });
        }
      }

      await this.repository.delete(profileId, userId);

      // Invalidate cache
      this.invalidateUserCache(userId, profileId);
    });
  }

  /**
   * Set a profile as default
   */
  async setDefaultProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    return withServiceError('set default profile', async () => {
      // Check if profile exists
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) {
        throw new NotFoundError('Profile');
      }

      // Unset all defaults and set this one
      await this.repository.unsetAllDefaults(userId);
      await this.repository.update(profileId, userId, { isDefault: true });

      // Invalidate cache
      this.invalidateUserCache(userId);
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

      // Invalidate cache
      this.invalidateUserCache(userId);

      return newProfile;
    });
  }
}

export const profileService = new ProfileService();
