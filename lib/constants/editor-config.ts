import { User, Briefcase, GraduationCap, Code, FolderOpen, Award, Languages, Heart, BookOpen, Quote, ShieldCheck, Star, LucideIcon } from "lucide-react";
import * as schemas from "@/lib/forms/form-schema";
import type { Resume } from "@/lib/validations/jsonresume";
import type { FormSchema, FieldConfig } from "@/lib/forms/schemas/types";
import type { z } from "zod";

export type EditorSectionType = 'object' | 'list';

/**
 * Editor section configuration
 * 
 * Note: This config uses flexible typing because each section has different
 * data shapes. The consuming components should validate/cast as needed.
 */
export interface EditorSection<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  isPrimary: boolean;
  type: EditorSectionType;
  field: keyof Resume;
  /** Zod schema for validation (object sections) */
  schema?: z.ZodType<T>;
  /** Field configurations for object sections */
  fields?: FieldConfig<T>[];
  /** Form schema for list sections */
  config?: FormSchema<T>;
  /** Transform data to form format */
  toForm?: (data: unknown) => T;
  /** Transform form data back to resume format */
  fromForm?: (data: T) => unknown;
}

export const EDITOR_CONFIG: EditorSection[] = [
  {
    id: "basics",
    label: "Basics",
    icon: User,
    isPrimary: true,
    type: 'object',
    field: 'basics',
    schema: schemas.personalInfoFormSchema,
    fields: schemas.personalInfoFields,
    toForm: schemas.basicsToFormData as (data: unknown) => any,
    fromForm: schemas.formDataToBasics as (data: any) => any,
  },
  {
    id: "experience",
    label: "Experience",
    icon: Briefcase,
    isPrimary: true,
    type: 'list',
    field: 'work',
    config: schemas.experienceFormSchema,
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    isPrimary: true,
    type: 'list',
    field: 'education',
    config: schemas.educationFormSchema,
  },
  {
    id: "skills",
    label: "Skills",
    icon: Code,
    isPrimary: true,
    type: 'list',
    field: 'skills',
    config: schemas.skillsFormSchema,
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderOpen,
    isPrimary: true,
    type: 'list',
    field: 'projects',
    config: schemas.projectsFormSchema,
  },
  {
    id: "certificates",
    label: "Certifications",
    icon: ShieldCheck,
    isPrimary: false,
    type: 'list',
    field: 'certificates',
    config: schemas.certificatesFormSchema,
  },
  {
    id: "languages",
    label: "Languages",
    icon: Languages,
    isPrimary: false,
    type: 'list',
    field: 'languages',
    config: schemas.languagesFormSchema,
  },
  {
    id: "volunteer",
    label: "Volunteer",
    icon: Heart,
    isPrimary: false,
    type: 'list',
    field: 'volunteer',
    config: schemas.volunteerFormSchema,
  },
  {
    id: "awards",
    label: "Awards",
    icon: Award,
    isPrimary: false,
    type: 'list',
    field: 'awards',
    config: schemas.awardsFormSchema,
  },
  {
    id: "publications",
    label: "Publications",
    icon: BookOpen,
    isPrimary: false,
    type: 'list',
    field: 'publications',
    config: schemas.publicationsFormSchema,
  },
  {
    id: "interests",
    label: "Interests",
    icon: Star,
    isPrimary: false,
    type: 'list',
    field: 'interests',
    config: schemas.interestsFormSchema,
  },
  {
    id: "references",
    label: "References",
    icon: Quote,
    isPrimary: false,
    type: 'list',
    field: 'references',
    config: schemas.referencesFormSchema,
  },
];
