"use client";

import { useState } from "react";
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
  const [projectsList, setProjectsList] = useState<Project[]>(projects);

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
    const updated = [...projectsList, newProject];
    setProjectsList(updated);
    onChange(updated);
  };

  const handleRemoveProject = (index: number) => {
    const updated = projectsList.filter((_, i) => i !== index);
    setProjectsList(updated);
    onChange(updated);
  };

  const handleProjectChange = (index: number, field: keyof Project, value: string | string[]) => {
    const updated = projectsList.map((project, i) => {
      if (i === index) {
        return { ...project, [field]: value };
      }
      return project;
    });
    setProjectsList(updated);
    onChange(updated);
  };

  const handleArrayFieldChange = (index: number, field: "highlights" | "keywords", value: string) => {
    const items = value.split("\n").filter((item) => item.trim() !== "");
    handleProjectChange(index, field, items);
  };

  return (
    <div className="space-y-6">
      {projectsList.map((project, index) => (
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
                value={project.name}
                onChange={(e) => handleProjectChange(index, "name", e.target.value)}
                placeholder="Personal Portfolio Website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`project-url-${index}`}>URL</Label>
              <Input
                id={`project-url-${index}`}
                value={project.url || ""}
                onChange={(e) => handleProjectChange(index, "url", e.target.value)}
                placeholder="https://project-url.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-description-${index}`}>Description</Label>
            <Textarea
              id={`project-description-${index}`}
              value={project.description || ""}
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
                value={project.startDate || ""}
                onChange={(e) => handleProjectChange(index, "startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`project-endDate-${index}`}>End Date</Label>
              <Input
                id={`project-endDate-${index}`}
                type="date"
                value={project.endDate || ""}
                onChange={(e) => handleProjectChange(index, "endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-highlights-${index}`}>Highlights (one per line)</Label>
            <Textarea
              id={`project-highlights-${index}`}
              value={(project.highlights || []).join("\n")}
              onChange={(e) => handleArrayFieldChange(index, "highlights", e.target.value)}
              placeholder="Implemented responsive design&#10;Optimized performance by 50%"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`project-keywords-${index}`}>Technologies/Keywords (one per line)</Label>
            <Textarea
              id={`project-keywords-${index}`}
              value={(project.keywords || []).join("\n")}
              onChange={(e) => handleArrayFieldChange(index, "keywords", e.target.value)}
              placeholder="React&#10;TypeScript&#10;Next.js"
              rows={3}
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
