"use client";

import { GenericFormList } from "@/components/forms/GenericFormList";
import { awardsFormSchema } from "@/lib/forms/form-schema";
import type { Award } from "@/lib/validations/jsonresume";

interface AwardsFormProps {
  readonly awards: Award[];
  readonly onChange: (awards: Award[]) => void;
  readonly autoSave?: boolean;
}

/**
 * Awards Form - Uses GenericFormList for schema-driven rendering
 */
export function AwardsForm({ awards, onChange, autoSave }: AwardsFormProps) {
  return (
    <GenericFormList
      schema={awardsFormSchema}
      items={awards}
      onChange={onChange}
      autoSave={autoSave}
    />
  );
}
