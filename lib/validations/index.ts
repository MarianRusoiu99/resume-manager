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
  generateStandaloneCoverLetterSchema,
  type GenerateCoverLetterInput,
  type GenerateStandaloneCoverLetterInput,
  
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
export { 
  resumeSchema, 
  type Resume,
  type Basics,
  type Location,
  type Profile,
  type Work,
  type Volunteer,
  type Education,
  type Award,
  type Certificate,
  type Publication,
  type Skill,
  type Language,
  type Interest,
  type Reference,
  type Project,
  type Meta,
} from './jsonresume';

// Strict resume validation
export {
  strictResumeSchema,
  validateResumeStrict,
  getValidationSummary,
  type ValidationError,
} from './jsonresume/strict';
