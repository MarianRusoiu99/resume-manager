"use client";

import { GenericFormList } from "@/components/forms";
import { referencesFormSchema } from "@/lib/forms";
import type { Reference } from "@/lib/validations/jsonresume";

interface ReferencesFormProps {
  readonly references: Reference[];
  readonly onChange: (references: Reference[]) => void;
}

export function ReferencesForm({ references, onChange }: ReferencesFormProps) {
  return (
    <GenericFormList
      schema={referencesFormSchema}
      items={references}
      onChange={onChange}
    />
  );
}
