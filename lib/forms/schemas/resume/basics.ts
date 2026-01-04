/**
 * Resume Form Schemas - Basics (Personal Info & Summary)
 */

import { z } from 'zod';
import type { FieldConfig } from '../types';
import type { Basics } from '@/lib/validations/jsonresume';

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

export const personalInfoFields: FieldConfig<PersonalInfoFormData>[] = [
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

export const summaryFields: FieldConfig<SummaryFormData>[] = [
  { key: 'summary', label: 'Professional Summary', type: 'textarea', rows: 10, colSpan: 2, description: 'Briefly describe your professional background and key strengths.' },
];
