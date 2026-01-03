/**
 * Resume Section Form Schemas
 */

import { z } from 'zod';
import { createFormSchema } from './utils';
import type { 
  Basics, Work, Education, Skill, Project, Certificate, Award, 
  Volunteer, Language, Publication, Interest, Reference 
} from '@/lib/validations/jsonresume';

// --- Basics / Personal Info ---

export const personalInfoFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  label: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")),
  phone: z.string().optional(),
  url: z.string().optional(),
  image: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoFormSchema>;

export const personalInfoFields: any[] = [ // Using any[] temporarily to avoid circular dependencies if any, but will be FieldConfig<PersonalInfoFormData>[]
  { key: 'name', label: 'Full Name', type: 'text', required: true },
  { key: 'label', label: 'Professional Label', type: 'text', placeholder: 'e.g. Full Stack Developer' },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
  { key: 'phone', label: 'Phone Number', type: 'tel' },
  { key: 'url', label: 'Personal Website', type: 'url', placeholder: 'https://yourwebsite.com' },
  { key: 'image', label: 'Profile Image URL', type: 'url', placeholder: 'https://...' },
  { key: 'address', label: 'Address', type: 'text', placeholder: '123 Street Name', colSpan: 2 },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'region', label: 'Region / State', type: 'text' },
  { key: 'postalCode', label: 'Postal Code', type: 'text' },
  { key: 'countryCode', label: 'Country Code', type: 'text', placeholder: 'e.g. US, GB' },
  { key: 'linkedin', label: 'LinkedIn URL', type: 'url', placeholder: 'https://linkedin.com/in/username' },
  { key: 'github', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/username' },
];

export function basicsToFormData(basics?: Basics): PersonalInfoFormData {
  const linkedinProfile = basics?.profiles?.find(p => p?.network?.toLowerCase() === 'linkedin');
  const githubProfile = basics?.profiles?.find(p => p?.network?.toLowerCase() === 'github');

  return {
    name: basics?.name || "",
    label: basics?.label || "",
    email: basics?.email || "",
    phone: basics?.phone || "",
    url: basics?.url || "",
    image: basics?.image || "",
    address: basics?.location?.address || "",
    city: basics?.location?.city || "",
    region: basics?.location?.region || "",
    postalCode: basics?.location?.postalCode || "",
    countryCode: basics?.location?.countryCode || "",
    linkedin: linkedinProfile?.url || "",
    github: githubProfile?.url || "",
  };
}

export function formDataToBasics(formData: PersonalInfoFormData): Basics {
  const profiles = [];
  if (formData.linkedin) profiles.push({ network: "LinkedIn", url: formData.linkedin });
  if (formData.github) profiles.push({ network: "GitHub", url: formData.github });

  return {
    name: formData.name,
    label: formData.label,
    email: formData.email,
    phone: formData.phone,
    url: formData.url,
    image: formData.image,
    location: {
      address: formData.address,
      city: formData.city,
      region: formData.region,
      postalCode: formData.postalCode,
      countryCode: formData.countryCode,
    },
    profiles,
  };
}

// --- Summary ---

export const summaryFormSchema = z.object({
  summary: z.string().optional(),
});

export type SummaryFormData = z.infer<typeof summaryFormSchema>;

export const summaryFields: any[] = [
  { key: 'summary', label: 'Professional Summary', type: 'textarea', rows: 10, colSpan: 2, description: 'Briefly describe your professional background and key strengths.' },
];

// --- List Sections ---

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
