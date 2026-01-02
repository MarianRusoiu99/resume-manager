"use client";

import { GenericFormList } from "@/components/forms/GenericFormList";
import { languagesFormSchema } from "@/lib/forms/form-schema";
import type { Language } from "@/lib/validations/jsonresume";

interface LanguagesFormProps {
  readonly languages: Language[];
  readonly onChange: (languages: Language[]) => void;
  readonly autoSave?: boolean;
}

/**
 * Languages Form - Uses GenericFormList for schema-driven rendering
 */
export default function LanguagesForm({
  languages = [],
  onChange,
  autoSave,
}: LanguagesFormProps) {
  return (
    <GenericFormList
      schema={languagesFormSchema}
      items={languages}
      onChange={onChange}
      autoSave={autoSave}
    />
  );
}
