/**
 * Core Resume Schema
 *
 * Single source of truth for JSON Resume schema definitions.
 * Provides base schema and validation variants.
 */

import { z } from 'zod';

const iso8601Schema = z.string().optional();

const urlSchema = z.string().optional();

const emailSchema = z.string().optional();

const locationSchema = z.object({
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  countryCode: z.string().optional(),
  region: z.string().optional(),
});

const profileSchema = z.object({
  network: z.string().optional(),
  username: z.string().optional(),
  url: urlSchema,
});

const basicsSchema = z.object({
  name: z.string().optional(),
  label: z.string().optional(),
  image: z.string().optional(),
  email: emailSchema,
  phone: z.string().optional(),
  url: urlSchema,
  summary: z.string().optional(),
  location: locationSchema.optional(),
  profiles: z.array(profileSchema).optional(),
});

const workSchema = z.object({
  name: z.string().optional(),
  position: z.string().optional(),
  url: urlSchema,
  startDate: iso8601Schema,
  endDate: iso8601Schema,
  summary: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

const volunteerSchema = z.object({
  organization: z.string().optional(),
  position: z.string().optional(),
  url: urlSchema,
  startDate: iso8601Schema,
  endDate: iso8601Schema,
  summary: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

const educationSchema = z.object({
  institution: z.string().optional(),
  url: urlSchema,
  area: z.string().optional(),
  studyType: z.string().optional(),
  startDate: iso8601Schema,
  endDate: iso8601Schema,
  score: z.string().optional(),
  courses: z.array(z.string()).optional(),
});

const awardSchema = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  awarder: z.string().optional(),
  summary: z.string().optional(),
});

const certificateSchema = z.object({
  name: z.string().optional(),
  date: z.string().optional(),
  issuer: z.string().optional(),
  url: urlSchema,
});

const publicationSchema = z.object({
  name: z.string().optional(),
  publisher: z.string().optional(),
  releaseDate: iso8601Schema,
  url: urlSchema,
  summary: z.string().optional(),
});

const skillSchema = z.object({
  name: z.string().optional(),
  level: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

const languageSchema = z.object({
  language: z.string().optional(),
  fluency: z.string().optional(),
});

const interestSchema = z.object({
  name: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

const referenceSchema = z.object({
  name: z.string().optional(),
  reference: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  startDate: iso8601Schema,
  endDate: iso8601Schema,
  url: urlSchema,
});

const metaSchema = z.object({
  canonical: z.string().optional(),
  lastModified: z.string().optional(),
}).catchall(z.unknown());

export const resumeSchema = z.object({
  $schema: z.string().optional(),
  basics: basicsSchema.optional(),
  work: z.array(workSchema).optional(),
  volunteer: z.array(volunteerSchema).optional(),
  education: z.array(educationSchema).optional(),
  awards: z.array(awardSchema).optional(),
  certificates: z.array(certificateSchema).optional(),
  publications: z.array(publicationSchema).optional(),
  skills: z.array(skillSchema).optional(),
  languages: z.array(languageSchema).optional(),
  interests: z.array(interestSchema).optional(),
  references: z.array(referenceSchema).optional(),
  projects: z.array(projectSchema).optional(),
  meta: metaSchema.optional(),
});

export type Resume = z.infer<typeof resumeSchema>;
export type Basics = z.infer<typeof basicsSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Work = z.infer<typeof workSchema>;
export type Volunteer = z.infer<typeof volunteerSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Award = z.infer<typeof awardSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Interest = z.infer<typeof interestSchema>;
export type Reference = z.infer<typeof referenceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Meta = z.infer<typeof metaSchema>;
