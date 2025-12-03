"use client";

import { SimpleFormField, SimpleFormFieldList } from "@/components/ui/simple-form-field";
import type { Project } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface ProjectsFormProps {
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

export function ProjectsForm({ projects, onChange }: ProjectsFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Project>({
    initialItems: projects,
    onChange,
    newItemTemplate: {
      name: "",
      description: "",
      highlights: [],
      keywords: [],
      startDate: "",
      endDate: "",
      url: "",
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Project"
      emptyMessage="No projects added yet. Click 'Add Project' to showcase your work."
      renderItem={(project, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SimpleFormField
            id={`project-name-${index}`}
            label="Project Name"
            value={project.name || ""}
            onChange={(value) => updateItem(index, "name", value)}
            placeholder="Personal Portfolio Website"
            required
          />

          <SimpleFormField
            id={`project-url-${index}`}
            label="URL"
            value={project.url || ""}
            onChange={(value) => updateItem(index, "url", value)}
            type="url"
            placeholder="https://project-url.com"
          />

          <div className="sm:col-span-2">
            <SimpleFormField
              id={`project-description-${index}`}
              label="Description"
              value={project.description || ""}
              onChange={(value) => updateItem(index, "description", value)}
              type="textarea"
              rows={3}
              placeholder="Brief description of the project"
            />
          </div>

          <SimpleFormField
            id={`project-startDate-${index}`}
            label="Start Date"
            value={project.startDate || ""}
            onChange={(value) => updateItem(index, "startDate", value)}
            type="date"
          />

          <SimpleFormField
            id={`project-endDate-${index}`}
            label="End Date"
            value={project.endDate || ""}
            onChange={(value) => updateItem(index, "endDate", value)}
            type="date"
          />

          <div className="sm:col-span-2">
            <SimpleFormFieldList
              id={`project-highlights-${index}`}
              label="Highlights"
              value={project.highlights || []}
              onChange={(value) => updateItem(index, "highlights", value)}
              separator="newline"
              type="textarea"
              rows={4}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              description="One highlight per line"
            />
          </div>

          <div className="sm:col-span-2">
            <SimpleFormFieldList
              id={`project-keywords-${index}`}
              label="Tech Stack"
              value={project.keywords || []}
              onChange={(value) => updateItem(index, "keywords", value)}
              separator="newline"
              type="textarea"
              rows={3}
              placeholder="React&#10;TypeScript&#10;Node.js"
              description="One technology per line"
            />
          </div>
        </div>
      )}
    />
  );
}
