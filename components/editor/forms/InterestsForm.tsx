"use client";

import { GenericFormList } from "@/components/forms";
import { interestsFormSchema } from "@/lib/forms";
import type { Interest } from "@/lib/validations/jsonresume";

interface InterestsFormProps {
  readonly interests: Interest[];
  readonly onChange: (interests: Interest[]) => void;
}

export function InterestsForm({ interests, onChange }: InterestsFormProps) {
  return (
    <GenericFormList
      schema={interestsFormSchema}
      items={interests}
      onChange={onChange}
    />
  );
}
