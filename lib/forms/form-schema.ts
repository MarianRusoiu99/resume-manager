/**
 * Form Field Configuration
 * 
 * Generic type-safe form field definitions for creating dynamic forms.
 * Used with useListForm and FormList for consistent form generation.
 */

/**
 * Base field configuration shared by all field types
 */
interface BaseFieldConfig<T> {
  /** Field key in the data object */
  key: keyof T;
  /** Display label */
  label: string;
  /** Whether field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Help text shown below field */
  description?: string;
  /** Grid column span (1 or 2 for full width) */
  colSpan?: 1 | 2;
}

/**
 * Text input field configuration
 */
interface TextFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'text' | 'email' | 'url' | 'tel';
}

/**
 * Textarea field configuration
 */
interface TextareaFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'textarea';
  rows?: number;
}

/**
 * Date/month input field configuration
 */
interface DateFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'date' | 'month';
}

/**
 * Select field configuration
 */
interface SelectFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'select';
  options: { value: string; label: string }[];
}

/**
 * List field configuration (for arrays like highlights, keywords)
 */
interface ListFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'list';
  /** Separator between items when displayed as string */
  separator?: 'newline' | 'comma';
  rows?: number;
}

/**
 * Union type for all field configurations
 */
export type FieldConfig<T> =
  | TextFieldConfig<T>
  | TextareaFieldConfig<T>
  | DateFieldConfig<T>
  | SelectFieldConfig<T>
  | ListFieldConfig<T>;

/**
 * Form schema definition
 */
export interface FormSchema<T> {
  /** Form fields in display order */
  fields: FieldConfig<T>[];
  /** Template for new items */
  newItemTemplate: T;
  /** Labels for add/remove buttons */
  labels?: {
    addButton?: string;
    emptyMessage?: string;
    itemTitle?: (item: T, index: number) => string;
  };
}

/**
 * Helper function to create a form schema with type inference
 */
export function createFormSchema<T>(schema: FormSchema<T>): FormSchema<T> {
  return schema;
}

/**
 * Get display value for a field
 */
export function getFieldValue<T>(item: T, key: keyof T): string {
  const value = item[key];
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/**
 * Check if a field should span full width
 */
export function isFullWidth<T>(field: FieldConfig<T>): boolean {
  if (field.colSpan === 2) return true;
  if (field.type === 'textarea') return true;
  if (field.type === 'list') return true;
  return false;
}

/**
 * Predefined form schemas for common resume sections
 */

import type { Work, Education, Skill, Project, Certificate, Award, Volunteer, Language, Publication, Interest, Reference } from '@/lib/validations/jsonresume';

export const experienceFormSchema = createFormSchema<Work>({
  fields: [
    { key: 'name', label: 'Company', type: 'text', required: true },
    { key: 'position', label: 'Job Title', type: 'text', required: true },
    { key: 'url', label: 'Company URL', type: 'url' },
    { key: 'startDate', label: 'Start Date', type: 'month', required: true },
    { key: 'endDate', label: 'End Date', type: 'month', placeholder: 'Leave empty if current' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 3, colSpan: 2, description: 'Describe your key responsibilities' },
    { key: 'highlights', label: 'Key Achievements', type: 'list', separator: 'newline', rows: 4, colSpan: 2, description: 'One achievement per line' },
  ],
  newItemTemplate: {
    name: '',
    position: '',
    url: '',
    startDate: '',
    endDate: '',
    summary: '',
    highlights: [],
  },
  labels: {
    addButton: 'Add Experience',
    emptyMessage: "No experience entries yet. Click 'Add Experience' to get started.",
    itemTitle: (item) => item.position || item.name || 'New Experience',
  },
});

export const educationFormSchema = createFormSchema<Education>({
  fields: [
    { key: 'institution', label: 'Institution', type: 'text', required: true },
    { key: 'studyType', label: 'Degree', type: 'text', required: true },
    { key: 'area', label: 'Field of Study', type: 'text' },
    { key: 'url', label: 'Institution URL', type: 'url' },
    { key: 'score', label: 'GPA/Score', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'month' },
    { key: 'endDate', label: 'End Date', type: 'month' },
    { key: 'courses', label: 'Courses', type: 'list', separator: 'comma', colSpan: 2, description: 'Comma-separated list of relevant courses' },
  ],
  newItemTemplate: {
    institution: '',
    studyType: '',
    area: '',
    url: '',
    score: '',
    startDate: '',
    endDate: '',
    courses: [],
  },
  labels: {
    addButton: 'Add Education',
    emptyMessage: "No education entries yet. Click 'Add Education' to get started.",
    itemTitle: (item) => item.studyType || item.institution || 'New Education',
  },
});

export const skillsFormSchema = createFormSchema<Skill>({
  fields: [
    { key: 'name', label: 'Skill Category', type: 'text', required: true },
    { key: 'level', label: 'Level', type: 'select', options: [
      { value: 'Beginner', label: 'Beginner' },
      { value: 'Intermediate', label: 'Intermediate' },
      { value: 'Advanced', label: 'Advanced' },
      { value: 'Expert', label: 'Expert' },
    ]},
    { key: 'keywords', label: 'Keywords', type: 'list', separator: 'comma', colSpan: 2, description: 'Comma-separated list of skills' },
  ],
  newItemTemplate: {
    name: '',
    level: '',
    keywords: [],
  },
  labels: {
    addButton: 'Add Skill Category',
    emptyMessage: "No skills yet. Click 'Add Skill Category' to get started.",
    itemTitle: (item) => item.name || 'New Skill',
  },
});

export const projectsFormSchema = createFormSchema<Project>({
  fields: [
    { key: 'name', label: 'Project Name', type: 'text', required: true },
    { key: 'url', label: 'Project URL', type: 'url' },
    { key: 'startDate', label: 'Start Date', type: 'month' },
    { key: 'endDate', label: 'End Date', type: 'month' },
    { key: 'description', label: 'Description', type: 'textarea', rows: 3, colSpan: 2 },
    { key: 'highlights', label: 'Highlights', type: 'list', separator: 'newline', rows: 4, colSpan: 2 },
    { key: 'keywords', label: 'Keywords', type: 'list', separator: 'comma', colSpan: 2, description: 'Comma-separated list of technologies used' },
  ],
  newItemTemplate: {
    name: '',
    url: '',
    startDate: '',
    endDate: '',
    description: '',
    highlights: [],
    keywords: [],
  },
  labels: {
    addButton: 'Add Project',
    emptyMessage: "No projects yet. Click 'Add Project' to get started.",
    itemTitle: (item) => item.name || 'New Project',
  },
});

export const certificatesFormSchema = createFormSchema<Certificate>({
  fields: [
    { key: 'name', label: 'Certificate Name', type: 'text', required: true },
    { key: 'issuer', label: 'Issuer', type: 'text' },
    { key: 'date', label: 'Date', type: 'month' },
    { key: 'url', label: 'URL', type: 'url' },
  ],
  newItemTemplate: {
    name: '',
    issuer: '',
    date: '',
    url: '',
  },
  labels: {
    addButton: 'Add Certificate',
    emptyMessage: "No certificates yet. Click 'Add Certificate' to get started.",
    itemTitle: (item) => item.name || 'New Certificate',
  },
});

export const languagesFormSchema = createFormSchema<Language>({
  fields: [
    { key: 'language', label: 'Language', type: 'text', required: true },
    { key: 'fluency', label: 'Fluency', type: 'text', placeholder: 'e.g. Native, Fluent, Professional' },
  ],
  newItemTemplate: {
    language: '',
    fluency: '',
  },
  labels: {
    addButton: 'Add Language',
    emptyMessage: "No languages yet. Click 'Add Language' to get started.",
    itemTitle: (item) => item.language || 'New Language',
  },
});

export const awardsFormSchema = createFormSchema<Award>({
  fields: [
    { key: 'title', label: 'Award Title', type: 'text', required: true },
    { key: 'awarder', label: 'Awarder', type: 'text' },
    { key: 'date', label: 'Date', type: 'month' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 2, colSpan: 2 },
  ],
  newItemTemplate: {
    title: '',
    awarder: '',
    date: '',
    summary: '',
  },
  labels: {
    addButton: 'Add Award',
    emptyMessage: "No awards yet. Click 'Add Award' to get started.",
    itemTitle: (item) => item.title || 'New Award',
  },
});

export const volunteerFormSchema = createFormSchema<Volunteer>({
  fields: [
    { key: 'organization', label: 'Organization', type: 'text', required: true },
    { key: 'position', label: 'Position', type: 'text', required: true },
    { key: 'url', label: 'Organization URL', type: 'url' },
    { key: 'startDate', label: 'Start Date', type: 'month' },
    { key: 'endDate', label: 'End Date', type: 'month' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 3, colSpan: 2 },
    { key: 'highlights', label: 'Highlights', type: 'list', separator: 'newline', rows: 3, colSpan: 2 },
  ],
  newItemTemplate: {
    organization: '',
    position: '',
    url: '',
    startDate: '',
    endDate: '',
    summary: '',
    highlights: [],
  },
  labels: {
    addButton: 'Add Volunteer Experience',
    emptyMessage: "No volunteer experience yet. Click 'Add Volunteer Experience' to get started.",
    itemTitle: (item) => item.position || item.organization || 'New Volunteer',
  },
});

export const publicationsFormSchema = createFormSchema<Publication>({
  fields: [
    { key: 'name', label: 'Title', type: 'text', required: true },
    { key: 'publisher', label: 'Publisher', type: 'text' },
    { key: 'releaseDate', label: 'Date', type: 'month' },
    { key: 'url', label: 'URL', type: 'url' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 2, colSpan: 2 },
  ],
  newItemTemplate: {
    name: '',
    publisher: '',
    releaseDate: '',
    url: '',
    summary: '',
  },
  labels: {
    addButton: 'Add Publication',
    emptyMessage: "No publications yet. Click 'Add Publication' to get started.",
    itemTitle: (item) => item.name || 'New Publication',
  },
});

export const interestsFormSchema = createFormSchema<Interest>({
  fields: [
    { key: 'name', label: 'Interest', type: 'text', required: true },
    { key: 'keywords', label: 'Keywords', type: 'list', separator: 'comma', description: 'Related activities or topics' },
  ],
  newItemTemplate: {
    name: '',
    keywords: [],
  },
  labels: {
    addButton: 'Add Interest',
    emptyMessage: "No interests yet. Click 'Add Interest' to get started.",
    itemTitle: (item) => item.name || 'New Interest',
  },
});

export const referencesFormSchema = createFormSchema<Reference>({
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'reference', label: 'Reference', type: 'textarea', rows: 3, colSpan: 2, description: 'Testimonial or contact info' },
  ],
  newItemTemplate: {
    name: '',
    reference: '',
  },
  labels: {
    addButton: 'Add Reference',
    emptyMessage: "No references yet. Click 'Add Reference' to get started.",
    itemTitle: (item) => item.name || 'New Reference',
  },
});
