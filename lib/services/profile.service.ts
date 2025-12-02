import { profileRepository } from "@/lib/repositories/profile.repository";
import { profileCache } from "@/lib/cache/simple-cache";
import { ZodError } from "zod";
import type { Resume } from "@/lib/validations/jsonresume";
import { logger } from "@/lib/utils/logger";

export class ProfileService {
  private getCacheKey(userId: string): string {
    return `profiles:${userId}`;
  }

  private getProfileCacheKey(profileId: string): string {
    return `profile:${profileId}`;
  }

  /**
   * Get all profiles for a user
   */
  async getProfiles(userId: string) {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(userId);
      const cached = profileCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      // Fetch from database
      const profiles = await profileRepository.findAllByUserId(userId);

      // Cache the result
      if (profiles) {
        profileCache.set(cacheKey, profiles);
      }

      return { success: true, data: profiles };
    } catch (error) {
      logger.error("Error fetching profiles", error);
      return {
        success: false,
        error: "Failed to fetch profiles",
      };
    }
  }

  /**
   * Get a specific profile by ID
   */
  async getProfileById(profileId: string, userId: string) {
    try {
      // Check cache first
      const cacheKey = this.getProfileCacheKey(profileId);
      const cached = profileCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      // Fetch from database
      const profile = await profileRepository.findById(profileId, userId);

      if (!profile) {
        return {
          success: false,
          error: "Profile not found",
        };
      }

      // Cache the result
      profileCache.set(cacheKey, profile);

      return { success: true, data: profile };
    } catch (error) {
      logger.error("Error fetching profile", error);
      return {
        success: false,
        error: "Failed to fetch profile",
      };
    }
  }

  /**
   * Get default profile for a user (for backward compatibility)
   */
  async getProfile(userId: string) {
    try {
      // Fetch default profile
      const profile = await profileRepository.findDefaultByUserId(userId);

      return { success: true, data: profile };
    } catch (error) {
      logger.error("Error fetching default profile", error);
      return {
        success: false,
        error: "Failed to fetch profile",
      };
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(userId: string, name: string, data: Resume, isDefault: boolean = false) {
    try {


      // If this is set as default, unset other defaults
      if (isDefault) {
        await profileRepository.unsetAllDefaults(userId);
      }

      // Create profile
      const profile = await profileRepository.create({
        userId,
        name,
        resume: data,
        isDefault,
      });

      // Invalidate cache
      const cacheKey = this.getCacheKey(userId);
      profileCache.delete(cacheKey);

      return { success: true, data: profile };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: "Validation error",
          details: error.issues,
        };
      }

      logger.error("Error creating profile", error);
      return {
        success: false,
        error: "Failed to create profile",
      };
    }
  }

  /**
   * Update a profile
   */
  async updateProfile(profileId: string, userId: string, data: Partial<{ name: string; resume: Resume; isDefault: boolean; selectedTemplateId: string | null }>) {
    try {
      // Check if profile exists and belongs to user
      const existing = await profileRepository.findById(profileId, userId);
      if (!existing) {
        return {
          success: false,
          error: "Profile not found",
        };
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await profileRepository.unsetAllDefaults(userId);
      }

      // Update profile
      const profile = await profileRepository.update(profileId, userId, data);

      // Invalidate cache
      const cacheKey = this.getCacheKey(userId);
      const profileCacheKey = this.getProfileCacheKey(profileId);
      profileCache.delete(cacheKey);
      profileCache.delete(profileCacheKey);

      return { success: true, data: profile };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: "Validation error",
          details: error.issues,
        };
      }

      logger.error("Error updating profile", error);
      return {
        success: false,
        error: "Failed to update profile",
      };
    }
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string, userId: string) {
    try {
      // Check if profile exists
      const profile = await profileRepository.findById(profileId, userId);
      if (!profile) {
        return {
          success: false,
          error: "Profile not found",
        };
      }

      // Don't allow deleting the last profile
      const allProfiles = await profileRepository.findAllByUserId(userId);
      if (allProfiles.length <= 1) {
        return {
          success: false,
          error: "Cannot delete your last profile",
        };
      }

      // If deleting default profile, set another as default
      if (profile.isDefault) {
        const otherProfile = allProfiles.find(p => p.id !== profileId);
        if (otherProfile) {
          await profileRepository.update(otherProfile.id, userId, { isDefault: true });
        }
      }

      await profileRepository.delete(profileId, userId);

      // Invalidate cache
      const cacheKey = this.getCacheKey(userId);
      const profileCacheKey = this.getProfileCacheKey(profileId);
      profileCache.delete(cacheKey);
      profileCache.delete(profileCacheKey);

      return { success: true };
    } catch (error) {
      logger.error("Error deleting profile", error);
      return {
        success: false,
        error: "Failed to delete profile",
      };
    }
  }

  /**
   * Set a profile as default
   */
  async setDefaultProfile(profileId: string, userId: string) {
    try {
      // Check if profile exists
      const profile = await profileRepository.findById(profileId, userId);
      if (!profile) {
        return {
          success: false,
          error: "Profile not found",
        };
      }

      // Unset all defaults and set this one
      await profileRepository.unsetAllDefaults(userId);
      await profileRepository.update(profileId, userId, { isDefault: true });

      // Invalidate cache
      const cacheKey = this.getCacheKey(userId);
      profileCache.delete(cacheKey);

      return { success: true };
    } catch (error) {
      logger.error("Error setting default profile", error);
      return {
        success: false,
        error: "Failed to set default profile",
      };
    }
  }

  /**
   * Duplicate a profile
   */
  async duplicateProfile(profileId: string, userId: string, newName?: string) {
    try {
      const profile = await profileRepository.findById(profileId, userId);
      if (!profile) {
        return {
          success: false,
          error: "Profile not found",
        };
      }

      const duplicateName = newName || `${profile.name} (Copy)`;

      const newProfile = await profileRepository.create({
        userId,
        name: duplicateName,
        resume: profile.resume as Resume,
        isDefault: false,
      });

      // Invalidate cache
      const cacheKey = this.getCacheKey(userId);
      profileCache.delete(cacheKey);

      return { success: true, data: newProfile };
    } catch (error) {
      logger.error("Error duplicating profile", error);
      return {
        success: false,
        error: "Failed to duplicate profile",
      };
    }
  }
}

export const profileService = new ProfileService();
