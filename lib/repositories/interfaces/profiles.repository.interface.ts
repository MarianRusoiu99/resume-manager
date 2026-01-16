/**
 * Profile Repository Interface
 * 
 * Defines the contract for profile data access operations.
 * Follows Interface Segregation Principle - only essential CRUD operations.
 */

import type { Resume } from '@/lib/validations/jsonresume';
import { TransactionClient } from '@/lib/db/transaction';

/**
 * Profile data structure returned from repository
 */
export interface ProfileData {
  id: string;
  userId: string;
  name: string;
  resume: Resume | null;
  isDefault: boolean;
  isPublic: boolean;
  publicSlug: string | null;
  selectedTemplateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profile with selected template included (for public profiles)
 */
export interface ProfileWithTemplate extends ProfileData {
  // Backward compatibility: some UI expects `templateId`
  templateId?: string | null;

  selectedTemplate?: {
    id: string;
    name: string;
    htmlTemplate: string;
  } | null;
}

/**
 * Input for creating a new profile
 */
export interface CreateProfileInput {
  userId: string;
  name: string;
  resume: Resume;
  isDefault?: boolean;
}

/**
 * Input for updating a profile
 */
export interface UpdateProfileInput {
  name?: string;
  resume?: Resume;
  isDefault?: boolean;
  isPublic?: boolean;
  publicSlug?: string | null;
  selectedTemplateId?: string | null;
}

/**
 * Profile Repository Interface
 * 
 * All profile data access implementations must fulfill this contract.
 */
export interface IProfileRepository {
  /**
   * Find all profiles for a user
   */
  findAllByUserId(userId: string, options?: any, tx?: TransactionClient): Promise<ProfileData[]>;

  /**
   * Find a specific profile by ID with optional user ownership check
   */
  findById(profileId: string, userId?: string, tx?: TransactionClient): Promise<ProfileData | null>;

  /**
   * Find the default profile for a user
   */
  findDefaultByUserId(userId: string, tx?: TransactionClient): Promise<ProfileData | null>;

  /**
   * Find by userId (backward compatibility - returns default profile)
   */
  findByUserId(userId: string, tx?: TransactionClient): Promise<ProfileData | null>;

  /**
   * Create a new profile
   */
  create(data: CreateProfileInput, tx?: TransactionClient): Promise<ProfileData>;

  /**
   * Update a profile
   */
  update(profileId: string, data: UpdateProfileInput, userId?: string, tx?: TransactionClient): Promise<ProfileData>;

  /**
   * Delete a profile
   */
  delete(profileId: string, userId?: string, tx?: TransactionClient): Promise<ProfileData>;

  /**
   * Unset all default flags for a user (used when setting a new default)
   */
  unsetAllDefaults(userId: string, tx?: TransactionClient): Promise<{ count: number }>;

  /**
   * Check if user has any profiles
   */
  profileExists(userId: string, tx?: TransactionClient): Promise<boolean>;

  /**
   * Get profile count for a user
   */
  profileCount(userId: string, tx?: TransactionClient): Promise<number>;

  /**
   * Find profile by public slug (for public sharing)
   */
  findByPublicSlug(slug: string, tx?: TransactionClient): Promise<ProfileWithTemplate | null>;
}
