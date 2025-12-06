"use client";

import { GenericFormList } from "@/components/forms";
import { publicationsFormSchema } from "@/lib/forms";
import type { Publication } from "@/lib/validations/jsonresume";

interface PublicationsFormProps {
  readonly publications: Publication[];
  readonly onChange: (publications: Publication[]) => void;
}

export function PublicationsForm({ publications, onChange }: PublicationsFormProps) {
  return (
    <GenericFormList
      schema={publicationsFormSchema}
      items={publications}
      onChange={onChange}
    />
  );
}
