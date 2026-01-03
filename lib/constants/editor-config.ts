import { User, Briefcase, GraduationCap, Code, FolderOpen, Award, Languages, Heart, BookOpen, Quote, ShieldCheck, Star } from "lucide-react";
import * as schemas from "@/lib/forms/form-schema";
import type { Resume } from "@/lib/validations/jsonresume";
import { ReactNode } from "react";

export type EditorSectionType = 'object' | 'list';

export interface EditorSection {
  id: string;
  label: string;
  icon: any;
  description?: string;
  isPrimary: boolean;
  type: EditorSectionType;
  field: keyof Resume;
  schema?: any; // FormSchema or Zod schema
  fields?: any[]; // For object types
  config?: any; // For list types
  // Custom helpers for mapping if needed
  toForm?: (data: any) => any;
  fromForm?: (data: any) => any;
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
    toForm: schemas.basicsToFormData,
    fromForm: schemas.formDataToBasics,
  },
  {
    id: "summary",
    label: "Summary",
    icon: BookOpen,
    isPrimary: true,
    type: 'object',
    field: 'basics', // Summary is part of basics
    schema: schemas.summaryFormSchema,
    fields: schemas.summaryFields,
    // Custom to/from to handle summary within basics
    toForm: (basics: any) => ({ summary: basics?.summary || "" }),
    fromForm: (data: any) => ({ summary: data.summary }),
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
