/**
 * Application Constants
 * 
 * Centralized constants for magic numbers and configuration values.
 * Prevents hardcoded values scattered throughout the codebase.
 */

/**
 * Pagination defaults
 */
export const PAGINATION = {
  /** Default page size for list endpoints */
  DEFAULT_LIMIT: 20,
  /** Maximum allowed page size */
  MAX_LIMIT: 100,
  /** Default page number */
  DEFAULT_PAGE: 1,
} as const;

/**
 * Notification settings
 */
export const NOTIFICATIONS = {
  /** Default number of notifications to fetch */
  DEFAULT_LIMIT: 50,
  /** Maximum notifications to fetch at once */
  MAX_LIMIT: 100,
  /** Default days to keep read notifications */
  CLEANUP_DAYS: 30,
  /** Polling interval in milliseconds */
  POLL_INTERVAL_MS: 30000,
} as const;

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  /** Profile cache TTL */
  PROFILE: 300, // 5 minutes
  /** Template cache TTL */
  TEMPLATE: 600, // 10 minutes
  /** Session cache TTL */
  SESSION: 3600, // 1 hour
  /** Static content cache TTL */
  STATIC: 86400, // 24 hours
} as const;

/**
 * Rate limiting defaults
 */
export const RATE_LIMIT = {
  /** Default window in milliseconds */
  DEFAULT_WINDOW_MS: 60000, // 1 minute
  /** Default max requests per window */
  DEFAULT_MAX_REQUESTS: 60,
  /** AI generation rate limit */
  AI_MAX_REQUESTS: 10,
  AI_WINDOW_MS: 60000,
} as const;

/**
 * File upload limits
 */
export const UPLOAD = {
  /** Maximum file size in bytes (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  /** Allowed file types for resume import */
  ALLOWED_TYPES: ['application/json', 'application/pdf'] as const,
} as const;

/**
 * Resume/Profile limits
 */
export const LIMITS = {
  /** Maximum profiles per user */
  MAX_PROFILES: 10,
  /** Maximum resumes per user */
  MAX_RESUMES: 50,
  /** Maximum cover letters per user */
  MAX_COVER_LETTERS: 100,
  /** Maximum length for job description */
  JOB_DESCRIPTION_MAX_LENGTH: 10000,
  /** Maximum length for personal instructions */
  PERSONAL_INSTRUCTIONS_MAX_LENGTH: 1000,
} as const;

/**
 * Auto-save settings
 */
export const AUTO_SAVE = {
  /** Debounce delay in milliseconds */
  DEBOUNCE_MS: 2000,
  /** Maximum time between saves */
  MAX_INTERVAL_MS: 30000,
} as const;

/**
 * Template categories
 */
export const TEMPLATE_CATEGORIES = [
  'PROFESSIONAL',
  'MODERN',
  'CREATIVE',
  'ATS_OPTIMIZED',
  'MINIMAL',
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = [
  'RESUME_GENERATED',
  'COVER_LETTER_GENERATED',
  'PROFILE_UPDATED',
  'SYSTEM',
  'ERROR',
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];
