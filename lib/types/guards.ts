/**
 * Type Guards for Runtime Type Checking
 * 
 * Provides runtime validation of data types using Zod schemas where available,
 * and custom guards for common type checks.
 */

import { z } from 'zod';
import { resumeSchema } from '@/lib/validations/jsonresume';
import type { Resume } from '@/lib/validations/jsonresume';
import type { ProfileData } from '@/lib/repositories/interfaces/profiles.repository.interface';

/**
 * Type guard for Resume objects
 * Uses Zod schema for runtime validation
 */
export function isValidResume(data: unknown): data is Resume {
  try {
    resumeSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for Profile objects
 */
export function isValidProfile(data: unknown): data is ProfileData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const profile = data as Record<string, unknown>;
  
  return (
    typeof profile.id === 'string' &&
    typeof profile.userId === 'string' &&
    typeof profile.name === 'string' &&
    (profile.resume === null || isValidResume(profile.resume)) &&
    typeof profile.isDefault === 'boolean' &&
    typeof profile.isPublic === 'boolean' &&
    (profile.publicSlug === null || typeof profile.publicSlug === 'string') &&
    (profile.selectedTemplateId === null || typeof profile.selectedTemplateId === 'string') &&
    profile.createdAt instanceof Date &&
    profile.updatedAt instanceof Date
  );
}

/**
 * API Error shape
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Type guard for API Error objects
 */
export function isValidApiError(error: unknown): error is ApiError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const apiError = error as Record<string, unknown>;
  
  return (
    typeof apiError.message === 'string' &&
    (apiError.code === undefined || typeof apiError.code === 'string') &&
    (apiError.statusCode === undefined || typeof apiError.statusCode === 'number')
  );
}

/**
 * Type guard for checking if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard for checking if value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard for checking if value is a valid JSON object
 */
export function isJsonObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) {
    return false;
  }

  try {
    // Check if the object can be stringified and parsed
    JSON.parse(JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for checking if error has a message property
 */
export function hasErrorMessage(error: unknown): error is { message: string } {
  return isObject(error) && typeof error.message === 'string';
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (hasErrorMessage(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}
