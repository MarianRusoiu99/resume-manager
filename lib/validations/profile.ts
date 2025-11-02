import { z } from "zod";
import { resumeSchema, type Resume } from "./jsonresume";

// Profile now contains a JSON Resume
export const profileSchema = z.object({
  resume: resumeSchema
});

// Partial update schema (resume is optional for updates)
export const profileUpdateSchema = z.object({
  resume: resumeSchema.optional()
});

// Type exports
export type Profile = z.infer<typeof profileSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// Re-export Resume type for convenience
export type { Resume };

// TEMPORARY: Legacy type aliases for backward compatibility
// TODO: Remove these in Phase 8 when UI components are refactored
export type PersonalInfo = Resume['basics'];
export type Experience = NonNullable<Resume['work']>[number];
export type Education = NonNullable<Resume['education']>[number];
export type Skills = Resume['skills'];
export type Certification = NonNullable<Resume['certificates']>[number];

