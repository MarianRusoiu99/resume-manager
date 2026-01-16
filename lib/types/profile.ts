import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Profile Domain Types
 *
 * Type definitions related to user profiles.
 */

/**
 * Standard result type for all Server Actions.
 * This is an alias for ServiceResult to maintain semantic clarity
 * while avoiding type duplication.
 */
export type ActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};

/**
 * Profile data transfer object (application boundary).
 * Represents a profile for use in server actions.
 */
export type ProfileDto = {
  id: string;
  userId: string;
  name: string;
  resume: Resume | null;
  isDefault: boolean;
  isPublic: boolean;
  publicSlug: string | null;
  selectedTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Simplified profile list item for UI.
 */
export type ProfileListItem = {
  id: string;
  name: string;
  isDefault: boolean;
};

/**
 * Profile input for creating a new profile.
 */
export type CreateProfileInput = {
  name: string;
  resume?: Resume;
  isDefault?: boolean;
  isPublic?: boolean;
  publicSlug?: string;
  selectedTemplateId?: string;
};

/**
 * Profile input for updating an existing profile.
 */
export type UpdateProfileInput = {
  name?: string;
  resume?: Resume;
  isDefault?: boolean;
  isPublic?: boolean;
  publicSlug?: string;
  selectedTemplateId?: string;
};
