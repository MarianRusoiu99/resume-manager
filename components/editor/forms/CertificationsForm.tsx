"use client";

import { GenericFormList } from "@/components/forms";
import { certificatesFormSchema } from "@/lib/forms";
import type { Certificate } from "@/lib/validations/jsonresume";

interface CertificationsFormProps {
  readonly certifications: Certificate[];
  readonly onChange: (certifications: Certificate[]) => void;
  readonly autoSave?: boolean;
}

export default function CertificationsForm({
  certifications = [],
  onChange,
  autoSave,
}: CertificationsFormProps) {
  return (
    <GenericFormList
      schema={certificatesFormSchema}
      items={certifications}
      onChange={onChange}
      autoSave={autoSave}
    />
  );
}
