"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`project-name-${index}`}>Project Name *</Label>
              <Input
                id={`project-name-${index}`}
                value={project.name || ""}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                placeholder="Personal Portfolio Website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`project-url-${index}`}>URL</Label>
              <Input
                id={`project-url-${index}`}
                value={project.url || ""}
                onChange={(e) => updateItem(index, "url", e.target.value)}
                placeholder="https://project-url.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-description-${index}`}>Description</Label>
            <Textarea
              id={`project-description-${index}`}
              value={project.description || ""}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              placeholder="Brief description of the project"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`project-startDate-${index}`}>Start Date</Label>
              <Input
                id={`project-startDate-${index}`}
                type="date"
                value={project.startDate || ""}
                onChange={(e) => updateItem(index, "startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`project-endDate-${index}`}>End Date</Label>
              <Input
                id={`project-endDate-${index}`}
                type="date"
                value={project.endDate || ""}
                onChange={(e) => updateItem(index, "endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-highlights-${index}`}>Highlights (one per line)</Label>
            <Textarea
              id={`project-highlights-${index}`}
              value={(project.highlights || []).join("\n")}
              onChange={(e) => {
                const items = e.target.value.split("\n").filter((item) => item.trim() !== "");
                updateItem(index, "highlights", items);
              }}
              placeholder="Feature 1&#10;Feature 2"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-keywords-${index}`}>Tech Stack (one per line)</Label>
            <Textarea
              id={`project-keywords-${index}`}
              value={(project.keywords || []).join("\n")}
              onChange={(e) => {
                const items = e.target.value.split("\n").filter((item) => item.trim() !== "");
                updateItem(index, "keywords", items);
              }}
              placeholder="React&#10;TypeScript&#10;Node.js"
              rows={4}
            />
          </div>
        </div>
      )}
    />
  );
}
