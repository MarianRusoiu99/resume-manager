"use client";

import { GenericFormList } from "@/components/forms/GenericFormList";
import { educationFormSchema } from "@/lib/forms/form-schema";
import type { Education } from "@/lib/validations/jsonresume";

interface EducationFormProps {
  readonly education: Education[];
  readonly onChange: (education: Education[]) => void;
}

/**
 * Education Form - Uses GenericFormList for schema-driven rendering
 */
export function EducationForm({ education, onChange }: EducationFormProps) {
  return (
    <GenericFormList
      schema={educationFormSchema}
      items={education}
      onChange={onChange}
    />
  );
}
