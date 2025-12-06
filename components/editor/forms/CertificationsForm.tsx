"use client";

import { GenericFormList } from "@/components/forms";
import { certificatesFormSchema } from "@/lib/forms";
import type { Certificate } from "@/lib/validations/jsonresume";

interface CertificationsFormProps {
  readonly certifications: Certificate[];
  readonly onChange: (certifications: Certificate[]) => void;
}

export default function CertificationsForm({
  certifications = [],
  onChange,
}: CertificationsFormProps) {
  return (
    <GenericFormList
      schema={certificatesFormSchema}
      items={certifications}
      onChange={onChange}
    />
  );
}
