"use client";

import { GenericFormList } from "@/components/forms/GenericFormList";
import { projectsFormSchema } from "@/lib/forms/form-schema";
import type { Project } from "@/lib/validations/jsonresume";

interface ProjectsFormProps {
  readonly projects: Project[];
  readonly onChange: (projects: Project[]) => void;
  readonly autoSave?: boolean;
}

/**
 * Projects Form - Uses GenericFormList for schema-driven rendering
 */
export function ProjectsForm({ projects, onChange, autoSave }: ProjectsFormProps) {
  return (
    <GenericFormList
      schema={projectsFormSchema}
      items={projects}
      onChange={onChange}
      autoSave={autoSave}
    />
  );
}
