import { z } from "zod";

// Personal Information Schema
export const personalInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

// Experience Entry Schema
export const experienceSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  title: z.string().min(1, "Job title is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
});

// Education Entry Schema
export const educationSchema = z.object({
  school: z.string().min(1, "School name is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  description: z.string().optional(),
});

// Skills Schema
export const skillsSchema = z.object({
  technical: z.array(z.string()).default([]),
  soft: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

// Certification Schema
export const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().optional(),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// Complete Profile Schema
export const profileSchema = z.object({
  personalInfo: personalInfoSchema,
  summary: z.string().max(1000, "Summary must be less than 1000 characters"),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: skillsSchema,
  certifications: z.array(certificationSchema).optional(),
});

// Partial update schema (all fields optional)
export const profileUpdateSchema = profileSchema.partial();

// Type exports
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
