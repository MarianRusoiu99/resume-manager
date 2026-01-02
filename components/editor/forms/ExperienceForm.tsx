"use client";

import { GenericFormList } from "@/components/forms/GenericFormList";
import { experienceFormSchema } from "@/lib/forms/form-schema";
import type { Work } from "@/lib/validations/jsonresume";

interface ExperienceFormProps {
  readonly experiences: Work[];
  readonly onChange: (experiences: Work[]) => void;
  readonly autoSave?: boolean;
}

/**
 * Experience Form - Uses GenericFormList for schema-driven rendering
 * 
 * The schema-based approach reduces boilerplate and ensures consistency
 * with other form sections while maintaining the same functionality.
 */
export function ExperienceForm({ experiences, onChange, autoSave }: ExperienceFormProps) {
  return (
    <GenericFormList
      schema={experienceFormSchema}
      items={experiences}
      onChange={onChange}
      autoSave={autoSave}
    />
  );
}
