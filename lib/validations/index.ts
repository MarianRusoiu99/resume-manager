/**
 * Validation Schemas Barrel Export
 * 
 * Centralized exports for all validation schemas.
 */

// Auth schemas
export {
  passwordSchema,
  strongPasswordSchema,
  emailSchema,
  nameSchema,
  loginSchema,
  registerSchema,
} from './auth';

// Shared prisma-free input schemas
export {
  aiProviderSchema,
  aiFeatureSchema,
  addApiProviderInputSchema,
  updateAIPreferenceInputSchema,
  type AIProviderType,
  type AIFeature,
  type AddApiProviderInput,
  type UpdateAIPreferenceInput,
} from './shared-inputs';

// API schemas
export {
  // Profile
  createProfileSchema,
  updateProfileSchema,
  type CreateProfileInput,
  type UpdateProfileInput,
  
  // Template
  createTemplateSchema,
  updateTemplateSchema,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  
  // Resume
  generateResumeSchema,
  updateResumeContentSchema,
  updateResumeTemplateSchema,
  type GenerateResumeInput,
  type UpdateResumeContentInput,
  type UpdateResumeTemplateInput,
  
  // Cover Letter
  generateCoverLetterSchema,
  updateCoverLetterSchema,
  type GenerateCoverLetterInput,
  type UpdateCoverLetterInput,
  
  // API Provider
  addApiProviderSchema,
  updateApiProviderSchema,
  type UpdateApiProviderInput,
  
  // Notification
  notificationQuerySchema,
  notificationActionSchema,
  type NotificationQuery,
  type NotificationAction,
  
  // Common
  paginationSchema,
  idParamSchema,
  type PaginationQuery,
  type IdParam,
} from './api-schemas';

// JSON Resume schemas
export { resumeSchema, type Resume } from './jsonresume';
