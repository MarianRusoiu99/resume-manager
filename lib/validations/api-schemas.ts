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

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

/**
 * Schema for creating a new profile
 */
export const createProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(100, 'Name must be less than 100 characters'),
  resume: z.object({}).passthrough(), // JSON Resume format
  isDefault: z.boolean().optional().default(false),
});

/**
 * Schema for updating a profile
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  resume: z.object({}).passthrough().optional(),
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
 * Template category enum
 */
export const templateCategorySchema = z.enum([
  'PROFESSIONAL',
  'MODERN',
  'CREATIVE',
  'ATS_OPTIMIZED',
  'MINIMAL',
]);

export type TemplateCategory = z.infer<typeof templateCategorySchema>;

/**
 * Schema for creating a new template
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: templateCategorySchema,
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  htmlTemplate: z.string().min(1, 'HTML template is required'),
  cssStyles: z.string().min(1, 'CSS styles are required'),
  previewUrl: z.string().url('Invalid preview URL').optional(),
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
  profileId: z.string().min(1, 'Profile ID is required'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  templateId: z.string().optional(),
  personalInstructions: z.string().max(1000).optional(),
});

/**
 * Schema for updating resume content
 */
export const updateResumeContentSchema = z.object({
  resume: z.object({}).passthrough(),
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
}).refine(
  (data) => data.resumeId || data.profileId,
  { message: 'Either resumeId or profileId is required' }
);

/**
 * Schema for updating a cover letter
 */
export const updateCoverLetterSchema = z.object({
  content: z.string().optional(),
  jobDescription: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
});

export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;
export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>;

// ============================================================================
// API PROVIDER SCHEMAS
// ============================================================================

/**
 * Supported AI providers
 * 
 * IMPORTANT: This must match the providers in:
 * - lib/ai/providers/factory.ts (SUPPORTED_PROVIDERS)
 * - lib/validations/settings.ts (SUPPORTED_PROVIDERS)
 * 
 * Only include providers with working implementations.
 */
export const aiProviderSchema = z.enum(['openai']);

export type AIProviderType = z.infer<typeof aiProviderSchema>;

/**
 * Schema for adding an API provider
 */
export const addApiProviderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  provider: aiProviderSchema,
  apiKey: z.string().min(10, 'API key is required').max(500, 'API key too long'),
});

/**
 * Schema for updating an API provider
 */
export const updateApiProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type AddApiProviderInput = z.infer<typeof addApiProviderSchema>;
export type UpdateApiProviderInput = z.infer<typeof updateApiProviderSchema>;

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

/**
 * Schema for notification query parameters
 */
export const notificationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  includeRead: z.coerce.boolean().default(false),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Pagination query parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/**
 * ID parameter schema
 */
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type IdParam = z.infer<typeof idParamSchema>;
