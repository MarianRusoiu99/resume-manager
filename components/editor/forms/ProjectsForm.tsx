"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/validations/jsonresume";
import { Trash2, Plus } from "lucide-react";

interface ProjectsFormProps {
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

export function ProjectsForm({ projects, onChange }: ProjectsFormProps) {
  // Use projects directly from props - controlled component pattern
  const projectsList = projects;

  const handleAddProject = () => {
    const newProject: Project = {
      name: "",
      description: "",
      highlights: [],
      keywords: [],
      startDate: "",
      endDate: "",
      url: "",
    };
    onChange([...projectsList, newProject]);
  };

  const handleRemoveProject = (index: number) => {
    onChange(projectsList.filter((_, i) => i !== index));
  };

  const handleProjectChange = (index: number, field: keyof NonNullable<Project>, value: string | string[]) => {
    const updated = projectsList.map((project, i) => {
      if (i === index && project) {
        return { ...project, [field]: value };
      }
      return project;
    });
    onChange(updated);
  };

  const handleHighlightsChange = (index: number, value: string) => {
    const items = value.split("\n").filter((item) => item.trim() !== "");
    handleProjectChange(index, "highlights", items);
  };

  const handleKeywordsChange = (index: number, value: string) => {
    const items = value.split("\n").filter((item) => item.trim() !== "");
    handleProjectChange(index, "keywords", items);
  };

  return (
    <div className="space-y-6">
      {projectsList.filter(project => project).map((project, index) => (
        <div key={index} className="border rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project {index + 1}</h3>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemoveProject(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`project-name-${index}`}>Project Name *</Label>
              <Input
                id={`project-name-${index}`}
                value={project!.name}
                onChange={(e) => handleProjectChange(index, "name", e.target.value)}
                placeholder="Personal Portfolio Website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`project-url-${index}`}>URL</Label>
              <Input
                id={`project-url-${index}`}
                value={project!.url || ""}
                onChange={(e) => handleProjectChange(index, "url", e.target.value)}
                placeholder="https://project-url.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-description-${index}`}>Description</Label>
            <Textarea
              id={`project-description-${index}`}
              value={project!.description || ""}
              onChange={(e) => handleProjectChange(index, "description", e.target.value)}
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
                value={project!.startDate || ""}
                onChange={(e) => handleProjectChange(index, "startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`project-endDate-${index}`}>End Date</Label>
              <Input
                id={`project-endDate-${index}`}
                type="date"
                value={project!.endDate || ""}
                onChange={(e) => handleProjectChange(index, "endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-highlights-${index}`}>Highlights (one per line)</Label>
            <Textarea
              id={`project-highlights-${index}`}
              value={(project!.highlights || []).join("\n")}
              onChange={(e) => handleHighlightsChange(index, e.target.value)}
              placeholder="Feature 1&#10;Feature 2"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-keywords-${index}`}>Tech Stack (one per line)</Label>
            <Textarea
              id={`project-keywords-${index}`}
              value={(project!.keywords || []).join("\n")}
              onChange={(e) => handleKeywordsChange(index, e.target.value)}
              placeholder="React&#10;TypeScript&#10;Node.js"
              rows={4}
            />
          </div>
        </div>
      ))}

      <Button type="button" onClick={handleAddProject} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Project
      </Button>
    </div>
  );
}
