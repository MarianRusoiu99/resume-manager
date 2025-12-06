"use client";

import { GenericFormList } from "@/components/forms";
import { volunteerFormSchema } from "@/lib/forms";
import type { Volunteer } from "@/lib/validations/jsonresume";

interface VolunteerFormProps {
  readonly volunteer: Volunteer[];
  readonly onChange: (volunteer: Volunteer[]) => void;
}

export function VolunteerForm({ volunteer, onChange }: VolunteerFormProps) {
  return (
    <GenericFormList
      schema={volunteerFormSchema}
      items={volunteer}
      onChange={onChange}
    />
  );
}
