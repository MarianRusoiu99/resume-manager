import { ProfileRepository, profileRepository } from "@/lib/repositories/profile.repository";
import { profileCache } from "@/lib/cache/simple-cache";
import { ZodError } from "zod";
import type { Resume } from "@/lib/validations/jsonresume";
import { logger } from "@/lib/utils/logger";
import { success, failure, type ServiceResult } from "@/lib/types/service-result";
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
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(userId);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return success(cached as ProfileList);
      }

      // Fetch from database
      const profiles = await this.repository.findAllByUserId(userId);

      // Cache the result
      if (profiles) {
        this.cache.set(cacheKey, profiles);
      }

      return success(profiles);
    } catch (error) {
      logger.error("Error fetching profiles", error);
      return failure("Failed to fetch profiles", "INTERNAL_ERROR");
    }
  }

  /**
   * Get a specific profile by ID
   */
  async getProfileById(profileId: string, userId: string): Promise<ServiceResult<NonNullable<Profile>>> {
    try {
      // Check cache first
      const cacheKey = this.getProfileCacheKey(profileId);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return success(cached as NonNullable<Profile>);
      }

      // Fetch from database
      const profile = await this.repository.findById(profileId, userId);

      if (!profile) {
        return failure("Profile not found", "NOT_FOUND");
      }

      // Cache the result
      this.cache.set(cacheKey, profile);

      return success(profile);
    } catch (error) {
      logger.error("Error fetching profile", error);
      return failure("Failed to fetch profile", "INTERNAL_ERROR");
    }
  }

  /**
   * Get default profile for a user (for backward compatibility)
   */
  async getProfile(userId: string): Promise<ServiceResult<Profile>> {
    try {
      // Fetch default profile
      const profile = await this.repository.findDefaultByUserId(userId);

      return success(profile);
    } catch (error) {
      logger.error("Error fetching default profile", error);
      return failure("Failed to fetch profile", "INTERNAL_ERROR");
    }
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
    try {
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

      return success(profile);
    } catch (error) {
      if (error instanceof ZodError) {
        return failure("Validation error: " + error.issues[0].message, "VALIDATION_ERROR");
      }

      logger.error("Error creating profile", error);
      return failure("Failed to create profile", "INTERNAL_ERROR");
    }
  }

  /**
   * Update a profile
   */
  async updateProfile(
    profileId: string, 
    userId: string, 
    data: Partial<{ name: string; resume: Resume; isDefault: boolean; selectedTemplateId: string | null }>
  ): Promise<ServiceResult<NonNullable<Profile>>> {
    try {
      // Check if profile exists and belongs to user
      const existing = await this.repository.findById(profileId, userId);
      if (!existing) {
        return failure("Profile not found", "NOT_FOUND");
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await this.repository.unsetAllDefaults(userId);
      }

      // Update profile
      const profile = await this.repository.update(profileId, userId, data);

      // Invalidate cache
      this.invalidateUserCache(userId, profileId);

      return success(profile);
    } catch (error) {
      if (error instanceof ZodError) {
        return failure("Validation error: " + error.issues[0].message, "VALIDATION_ERROR");
      }

      logger.error("Error updating profile", error);
      return failure("Failed to update profile", "INTERNAL_ERROR");
    }
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      // Check if profile exists
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) {
        return failure("Profile not found", "NOT_FOUND");
      }

      // Don't allow deleting the last profile
      const allProfiles = await this.repository.findAllByUserId(userId);
      if (allProfiles.length <= 1) {
        return failure("Cannot delete your last profile", "CONFLICT");
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

      return success(undefined as void);
    } catch (error) {
      logger.error("Error deleting profile", error);
      return failure("Failed to delete profile", "INTERNAL_ERROR");
    }
  }

  /**
   * Set a profile as default
   */
  async setDefaultProfile(profileId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      // Check if profile exists
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) {
        return failure("Profile not found", "NOT_FOUND");
      }

      // Unset all defaults and set this one
      await this.repository.unsetAllDefaults(userId);
      await this.repository.update(profileId, userId, { isDefault: true });

      // Invalidate cache
      this.invalidateUserCache(userId);

      return success(undefined as void);
    } catch (error) {
      logger.error("Error setting default profile", error);
      return failure("Failed to set default profile", "INTERNAL_ERROR");
    }
  }

  /**
   * Duplicate a profile
   */
  async duplicateProfile(
    profileId: string, 
    userId: string, 
    newName?: string
  ): Promise<ServiceResult<NonNullable<Profile>>> {
    try {
      const profile = await this.repository.findById(profileId, userId);
      if (!profile) {
        return failure("Profile not found", "NOT_FOUND");
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

      return success(newProfile);
    } catch (error) {
      logger.error("Error duplicating profile", error);
      return failure("Failed to duplicate profile", "INTERNAL_ERROR");
    }
  }
}

export const profileService = new ProfileService();
