"use client";

import { useState } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Basics } from "@/lib/validations/jsonresume";
import { GenericForm } from "@/components/forms/GenericForm";
import { FieldConfig } from "@/lib/forms/form-schema";

interface PersonalInfoFormProps {
  initialData?: Basics;
  onChange?: (data: Basics) => void;
}

interface PersonalInfoFormData {
  name: string;
  label: string;
  email: string;
  phone: string;
  url: string;
  image: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  linkedin: string;
  github: string;
}

const PERSONAL_INFO_FIELDS: FieldConfig<PersonalInfoFormData>[] = [
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

function basicsToFormData(basics?: Basics): PersonalInfoFormData {
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

function formDataToBasics(formData: PersonalInfoFormData): Basics {
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

export function PersonalInfoForm({ initialData, onChange }: PersonalInfoFormProps) {
  const [data, setData] = useState<PersonalInfoFormData>(basicsToFormData(initialData));

  useAutoSave({
    data,
    onSave: async (currentData) => {
      onChange?.(formDataToBasics(currentData));
    },
  });

  return (
    <GenericForm
      fields={PERSONAL_INFO_FIELDS}
      data={data}
      onChange={setData}
    />
  );
}
