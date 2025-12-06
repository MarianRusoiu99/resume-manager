"use client";

import { GenericFormList } from "@/components/forms/GenericFormList";
import { languagesFormSchema } from "@/lib/forms/form-schema";
import type { Language } from "@/lib/validations/jsonresume";

interface LanguagesFormProps {
  readonly languages: Language[];
  readonly onChange: (languages: Language[]) => void;
}

/**
 * Languages Form - Uses GenericFormList for schema-driven rendering
 */
export default function LanguagesForm({
  languages = [],
  onChange,
}: LanguagesFormProps) {
  return (
    <GenericFormList
      schema={languagesFormSchema}
      items={languages}
      onChange={onChange}
    />
  );
}
