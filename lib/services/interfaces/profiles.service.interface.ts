/**
 * Profile Service Interface
 * 
 * Defines the contract for profile business logic operations.
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { ServiceResult } from '@/lib/types/service-result';
import type { JsonValue } from '@prisma/client/runtime/library';

/**
 * Profile data returned from service operations
 * 
 * Note: The resume field uses JsonValue from Prisma for compatibility
 * with the database layer. Consumers should validate/cast to Resume type.
 */
export interface ProfileServiceData {
  id: string;
  userId: string;
  name: string;
  resume: JsonValue;
  templateId: string | null;
  /**
   * Backward-compatible alias for `templateId`.
   * Used by client hooks/components.
   */
  selectedTemplateId: string | null;
  isDefault: boolean;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profile update input
 */
export interface UpdateProfileServiceInput {
  name?: string;
  resume?: Resume;
  isDefault?: boolean;
  isPublic?: boolean;
  publicSlug?: string | null;
  selectedTemplateId?: string | null;
}

/**
 * Profile Service Interface
 */
export interface IProfileService {
  /**
   * Get all profiles for a user
   */
  getProfiles(userId: string): Promise<ServiceResult<ProfileServiceData[]>>;

  /**
   * Get a specific profile by ID
   */
  getProfileById(profileId: string, userId: string): Promise<ServiceResult<ProfileServiceData>>;

  /**
   * Get default profile for a user
   */
  getProfile(userId: string): Promise<ServiceResult<ProfileServiceData | null>>;

  /**
   * Create a new profile
   */
  createProfile(
    userId: string,
    name: string,
    data: Resume,
    isDefault?: boolean
  ): Promise<ServiceResult<ProfileServiceData>>;

  /**
   * Update a profile
   */
  updateProfile(
    profileId: string,
    userId: string,
    data: UpdateProfileServiceInput
  ): Promise<ServiceResult<ProfileServiceData>>;

  /**
   * Delete a profile
   */
  deleteProfile(profileId: string, userId: string): Promise<ServiceResult<void>>;

  /**
   * Set a profile as default
   */
  setDefaultProfile(profileId: string, userId: string): Promise<ServiceResult<void>>;

  /**
   * Duplicate a profile
   */
  duplicateProfile(
    profileId: string,
    userId: string,
    newName?: string
  ): Promise<ServiceResult<ProfileServiceData>>;
}
