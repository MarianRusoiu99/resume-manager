/**
 * Strict Resume Validation
 *
 * Provides strict validation for AI-generated resume output.
 * Uses the same Resume type as base schema but with runtime validation
 * that ensures data quality.
 */

import { z } from 'zod';
import { type Resume } from './schema';

const strictIso8601Schema = z.string().regex(
  /^([1-2]\d{3}(-((0[1-9]|1[0-2])(-([0-2]\d|3[0-1]))?))?)$/,
  'Date must be in YYYY, YYYY-MM, or YYYY-MM-DD format'
);

const strictUrlSchema = z.string().regex(
  /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  'Must be a valid URL starting with http:// or https://'
);

const strictEmailSchema = z.string().regex(
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  'Must be a valid email address'
);

const strictLocationSchema = z.object({
  address: z.string().min(1, 'Address is required').optional(),
  postalCode: z.string().min(1, 'Postal code is required').optional(),
  city: z.string().min(1, 'City is required'),
  countryCode: z.string().length(2, 'Country code must be 2 characters').optional(),
  region: z.string().min(1, 'Region is required').optional(),
});

const strictProfileSchema = z.object({
  network: z.string().min(1, 'Network name is required'),
  username: z.string().min(1, 'Username is required'),
  url: strictUrlSchema.optional(),
});

const strictBasicsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  label: z.string().min(1, 'Professional label is required').optional(),
  image: strictUrlSchema.optional(),
  email: strictEmailSchema,
  phone: z.string().min(1, 'Phone is required').optional(),
  url: strictUrlSchema.optional(),
  summary: z.string().min(10, 'Summary should be at least 10 characters').optional(),
  location: strictLocationSchema.optional(),
  profiles: z.array(strictProfileSchema).optional(),
});

const strictWorkSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  location: z.string().optional(),
  description: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  url: strictUrlSchema.optional(),
  startDate: strictIso8601Schema,
  endDate: strictIso8601Schema.optional(),
  summary: z.string().min(10, 'Summary should be at least 10 characters').optional(),
  highlights: z.array(z.string().min(1)).min(1, 'At least one highlight is required').optional(),
});

const strictVolunteerSchema = z.object({
  organization: z.string().min(1, 'Organization name is required'),
  position: z.string().min(1, 'Position is required'),
  url: strictUrlSchema.optional(),
  startDate: strictIso8601Schema,
  endDate: strictIso8601Schema.optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string().min(1)).optional(),
});

const strictEducationSchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  url: strictUrlSchema.optional(),
  area: z.string().min(1, 'Area of study is required'),
  studyType: z.string().min(1, 'Study type is required'),
  startDate: strictIso8601Schema,
  endDate: strictIso8601Schema.optional(),
  score: z.string().optional(),
  courses: z.array(z.string().min(1)).optional(),
});

const strictAwardSchema = z.object({
  title: z.string().min(1, 'Award title is required'),
  date: strictIso8601Schema.optional(),
  awarder: z.string().min(1, 'Awarder is required'),
  summary: z.string().optional(),
});

const strictCertificateSchema = z.object({
  name: z.string().min(1, 'Certificate name is required'),
  date: strictIso8601Schema.optional(),
  issuer: z.string().min(1, 'Issuer is required'),
  url: strictUrlSchema.optional(),
});

const strictPublicationSchema = z.object({
  name: z.string().min(1, 'Publication name is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  releaseDate: strictIso8601Schema.optional(),
  url: strictUrlSchema.optional(),
  summary: z.string().optional(),
});

const strictSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
  keywords: z.array(z.string().min(1)).optional(),
});

const strictLanguageSchema = z.object({
  language: z.string().min(1, 'Language name is required'),
  fluency: z.enum(['Elementary', 'Limited Working', 'Professional Working', 'Full Professional', 'Native']).optional(),
});

const strictInterestSchema = z.object({
  name: z.string().min(1, 'Interest name is required'),
  keywords: z.array(z.string().min(1)).optional(),
});

const strictReferenceSchema = z.object({
  name: z.string().min(1, 'Reference name is required'),
  reference: z.string().min(10, 'Reference text should be at least 10 characters'),
});

const strictProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(10, 'Description should be at least 10 characters'),
  highlights: z.array(z.string().min(1)).optional(),
  keywords: z.array(z.string().min(1)).optional(),
  startDate: strictIso8601Schema.optional(),
  endDate: strictIso8601Schema.optional(),
  url: strictUrlSchema.optional(),
  roles: z.array(z.string().min(1)).optional(),
  entity: z.string().optional(),
  type: z.string().optional(),
});

const strictMetaSchema = z.object({
  canonical: strictUrlSchema.optional(),
  lastModified: z.string().optional(),
}).catchall(z.unknown());

export const strictResumeSchema = z.object({
  $schema: strictUrlSchema.optional(),
  basics: strictBasicsSchema,
  work: z.array(strictWorkSchema).optional(),
  volunteer: z.array(strictVolunteerSchema).optional(),
  education: z.array(strictEducationSchema).optional(),
  awards: z.array(strictAwardSchema).optional(),
  certificates: z.array(strictCertificateSchema).optional(),
  publications: z.array(strictPublicationSchema).optional(),
  skills: z.array(strictSkillSchema).optional(),
  languages: z.array(strictLanguageSchema).optional(),
  interests: z.array(strictInterestSchema).optional(),
  references: z.array(strictReferenceSchema).optional(),
  projects: z.array(strictProjectSchema).optional(),
  meta: strictMetaSchema.optional(),
});

export interface ValidationError {
  path: string;
  message: string;
}

export function validateResumeStrict(data: unknown): {
  success: boolean;
  data?: Resume;
  errors?: ValidationError[];
} {
  const result = strictResumeSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  
  return { success: false, errors };
}

export function getValidationSummary(errors: ValidationError[]): string[] {
  return errors.map((error) => `${error.path}: ${error.message}`);
}
