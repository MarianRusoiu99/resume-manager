/**
 * Resume Form Schemas - Basics (Personal Info & Summary)
 */

import { z } from 'zod';
import type { FieldConfig } from '@/lib/types';
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
  summary: z.string().optional(),
  profiles: z.array(z.object({
    network: z.string().min(1, "Network is required"),
    username: z.string().optional(),
    url: z.string().url("Invalid URL").or(z.literal("")),
  })).optional(),
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
  { key: 'profiles', label: 'Social Profiles', type: 'profiles', colSpan: 2 },
  { key: 'summary', label: 'Professional Summary', type: 'richtext', colSpan: 2, description: 'Briefly describe your professional background and key strengths.' },
];

export function basicsToFormData(basics?: Basics): PersonalInfoFormData {
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
    summary: basics?.summary || "",
    profiles: basics?.profiles?.map(p => ({
      network: p.network || "",
      username: p.username || "",
      url: p.url || "",
    })) || [],
  };
}

export function formDataToBasics(formData: PersonalInfoFormData): Basics {
  return {
    name: formData.name,
    label: formData.label,
    email: formData.email,
    phone: formData.phone,
    url: formData.url,
    image: formData.image,
    summary: formData.summary,
    location: {
      address: formData.address,
      city: formData.city,
      region: formData.region,
      postalCode: formData.postalCode,
      countryCode: formData.countryCode,
    },
    profiles: formData.profiles?.map(p => ({
      network: p.network,
      username: p.username,
      url: p.url,
    })) || [],
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
