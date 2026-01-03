"use client";

import { GenericFormList } from "@/components/forms/GenericFormList";
import { skillsFormSchema } from "@/lib/forms/form-schema";
import type { Skill } from "@/lib/validations/jsonresume";

interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
  autoSave?: boolean;
}

export function SkillsForm({ skills = [], onChange, autoSave = true }: SkillsFormProps) {
  return (
    <GenericFormList
      schema={skillsFormSchema}
      items={skills}
      onChange={onChange}
      autoSave={autoSave}
    />
  );
}

export default SkillsForm;
