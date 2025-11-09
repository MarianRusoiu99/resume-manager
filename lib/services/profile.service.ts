import { profileRepository } from "@/lib/repositories/profile.repository";
import { profileSchema, profileUpdateSchema } from "@/lib/validations/profile";
import { profileCache } from "@/lib/cache/simple-cache";
import { ZodError } from "zod";

export class ProfileService {
  private getCacheKey(userId: string): string {
    return `profile:${userId}`;
  }

  async getProfile(userId: string) {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(userId);
      const cached = profileCache.get(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      // Fetch from database
      const profile = await profileRepository.findByUserId(userId);
      
      // Cache the result if found
      if (profile) {
        profileCache.set(cacheKey, profile);
      }
      
      return { success: true, data: profile };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return {
        success: false,
        error: "Failed to fetch profile",
      };
    }
  }

  async createProfile(userId: string, data: unknown) {
    try {
      // Validate input
      const validatedData = profileSchema.parse(data);

      // Check if profile already exists
      const exists = await profileRepository.exists(userId);
      if (exists) {
        return {
          success: false,
          error: "Profile already exists. Use update instead.",
        };
      }

      // Create profile
      const profile = await profileRepository.create(userId, validatedData.resume);

      // Invalidate cache
      const cacheKey = this.getCacheKey(userId);
      profileCache.delete(cacheKey);

      return { success: true, data: { userId, resume: profile } };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: "Validation error",
          details: error.issues,
        };
      }

      console.error("Error creating profile:", error);
      return {
        success: false,
        error: "Failed to create profile",
      };
    }
  }

  async updateProfile(userId: string, data: unknown) {
    try {
      // Validate input (partial update allowed)
      const validatedData = profileUpdateSchema.parse(data);

      // Check if profile exists
      const exists = await profileRepository.exists(userId);
      if (!exists) {
        return {
          success: false,
          error: "Profile not found. Create one first.",
        };
      }

      // Update profile
      if (!validatedData.resume) {
        return {
          success: false,
          error: "No resume data provided for update",
        };
      }
      
      const profile = await profileRepository.update(userId, validatedData.resume);

      // Invalidate cache
      const cacheKey = this.getCacheKey(userId);
      profileCache.delete(cacheKey);

      return { success: true, data: { userId, resume: profile } };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: "Validation error",
          details: error.issues,
        };
      }

      console.error("Error updating profile:", error);
      return {
        success: false,
        error: "Failed to update profile",
      };
    }
  }

  async upsertProfile(userId: string, data: unknown) {
    try {
      // Upsert profile without validation
      const profile = await profileRepository.upsert(userId, (data as any).resume);

      // Invalidate cache
      const cacheKey = this.getCacheKey(userId);
      profileCache.delete(cacheKey);

      return { success: true, data: { userId, resume: profile } };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: "Validation error",
          details: error.issues,
        };
      }

      console.error("Error upserting profile:", error);
      return {
        success: false,
        error: "Failed to save profile",
      };
    }
  }

  async deleteProfile(userId: string) {
    try {
      await profileRepository.delete(userId);
      
      // Invalidate cache
      const cacheKey = this.getCacheKey(userId);
      profileCache.delete(cacheKey);
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting profile:", error);
      return {
        success: false,
        error: "Failed to delete profile",
      };
    }
  }

  async profileExists(userId: string): Promise<boolean> {
    return profileRepository.exists(userId);
  }
}

export const profileService = new ProfileService();
