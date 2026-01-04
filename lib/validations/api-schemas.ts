/**
 * API Validation Schemas
 * 
 * Centralized Zod schemas for API request/response validation.
 * Single source of truth for all API validation rules.
 * 
 * @example
 * ```typescript
 * import { createProfileSchema, updateProfileSchema } from '@/lib/validations/api-schemas';
 * 
 * // In API route:
 * export const POST = createApiHandler(handler, { bodySchema: createProfileSchema });
 * 
 * // In service:
 * const validated = createProfileSchema.parse(input);
 * ```
 */
import { z } from 'zod';
import {
  aiProviderSchema
} from './shared-inputs';
import { resumeSchema} from './jsonresume';

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

/**
 * Schema for creating a new profile
 */
export const createProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(100, 'Name must be less than 100 characters'),
  resume: resumeSchema.passthrough(),
  isDefault: z.boolean().optional().default(false),
});

/**
 * Schema for updating a profile
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  resume: resumeSchema.passthrough().optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  publicSlug: z.string().nullable().optional(),
  selectedTemplateId: z.string().nullable().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================================================
// TEMPLATE SCHEMAS
// ============================================================================

/**
 * Schema for creating a new template
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  htmlTemplate: z.string().min(1, 'HTML template is required'),
  previewUrl: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid preview URL' }
    ),
  isPublic: z.boolean().default(true),
});

/**
 * Schema for updating a template
 */
export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// ============================================================================
// RESUME SCHEMAS
// ============================================================================

/**
 * Schema for resume generation input
 */
export const generateResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  profileId: z.string().optional(),
  templateId: z.string().optional(),
  modelId: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  personalInstructions: z.string().max(1000).optional(),
});

/**
 * Schema for updating resume content
 */
export const updateResumeContentSchema = z.object({
  resume: resumeSchema.passthrough(),
  jobDescription: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
});

/**
 * Schema for updating resume template
 */
export const updateResumeTemplateSchema = z.object({
  templateId: z.string().nullable(),
});

export type GenerateResumeInput = z.infer<typeof generateResumeSchema>;
export type UpdateResumeContentInput = z.infer<typeof updateResumeContentSchema>;
export type UpdateResumeTemplateInput = z.infer<typeof updateResumeTemplateSchema>;

// ============================================================================
// COVER LETTER SCHEMAS
// ============================================================================

/**
 * Schema for generating a cover letter
 */
export const generateCoverLetterSchema = z.object({
  resumeId: z.string().optional(),
  profileId: z.string().optional(),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  personalInstructions: z.string().max(1000).optional(),
  modelId: z.string().optional(),
}).refine(
  (data) => data.resumeId || data.profileId,
  { message: 'Either resumeId or profileId is required' }
);

export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;

// ============================================================================
// STANDALONE COVER LETTER SCHEMA
// ============================================================================

/**
 * Schema for generating a standalone cover letter (no resumeId required)
 */
export const generateStandaloneCoverLetterSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  profileId: z.string().optional(),
  personalInstructions: z.string().max(1000).optional(),
  modelId: z.string().optional(),
});

export type GenerateStandaloneCoverLetterInput = z.infer<typeof generateStandaloneCoverLetterSchema>;

/**
 * Helper to resolve resumeId or profileId from input
 */
export function resolveResumeIdOrProfileId(
  data: { resumeId?: string; profileId?: string }
): string | undefined {
  return data.resumeId || data.profileId;
}

// ============================================================================
// API PROVIDER SCHEMAS
// ============================================================================

/**
 * Schema for adding an API provider
 */
export const addApiProviderSchema = z.object({
  name: z.string().min(1).max(100),
  provider: aiProviderSchema,
  apiKey: z.string().min(1),
});

/**
 * Schema for updating an API provider
 */
export const updateApiProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateApiProviderInput = z.infer<typeof updateApiProviderSchema>;

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

/**
 * Schema for querying notifications
 */
export const notificationQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

/**
 * Schema for notification actions
 */
export const notificationActionSchema = z.object({
  action: z.enum(['mark-read', 'mark-unread', 'delete']),
  id: z.string(),
});

export type NotificationAction = z.infer<typeof notificationActionSchema>;

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Schema for pagination
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/**
 * Schema for ID parameter
 */
export const idParamSchema = z.object({
  id: z.string(),
});

export type IdParam = z.infer<typeof idParamSchema>;
