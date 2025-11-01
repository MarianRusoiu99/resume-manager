"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Experience } from "@/lib/validations/profile";

interface ExperienceFormProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export function ExperienceForm({ experiences, onChange }: ExperienceFormProps) {
  const [localExperiences, setLocalExperiences] = useState<Experience[]>(
    experiences.length > 0 ? experiences : []
  );

  const addExperience = () => {
    const newExperience: Experience = {
      company: "",
      title: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: [],
    };
    const updated = [...localExperiences, newExperience];
    setLocalExperiences(updated);
    onChange(updated);
  };

  const removeExperience = (index: number) => {
    const updated = localExperiences.filter((_, i) => i !== index);
    setLocalExperiences(updated);
    onChange(updated);
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean | string[]) => {
    const updated = localExperiences.map((exp, i) => {
      if (i === index) {
        return { ...exp, [field]: value };
      }
      return exp;
    });
    setLocalExperiences(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {localExperiences.map((experience, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg space-y-4 relative"
        >
          {/* Remove Button */}
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => removeExperience(index)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`company-${index}`}>Company *</Label>
              <Input
                id={`company-${index}`}
                value={experience.company}
                onChange={(e) => updateExperience(index, "company", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`title-${index}`}>Job Title *</Label>
              <Input
                id={`title-${index}`}
                value={experience.title}
                onChange={(e) => updateExperience(index, "title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`start-${index}`}>Start Date *</Label>
              <Input
                id={`start-${index}`}
                type="month"
                value={experience.startDate}
                onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`end-${index}`}>End Date</Label>
              <Input
                id={`end-${index}`}
                type="month"
                value={experience.endDate}
                onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                disabled={experience.current}
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={experience.current}
                  onChange={(e) => {
                    updateExperience(index, "current", e.target.checked);
                    if (e.target.checked) {
                      updateExperience(index, "endDate", "");
                    }
                  }}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-sm font-normal">
                  I currently work here
                </span>
              </Label>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor={`description-${index}`}>Description</Label>
              <Textarea
                id={`description-${index}`}
                value={experience.description}
                onChange={(e) => updateExperience(index, "description", e.target.value)}
                rows={4}
                placeholder="Describe your role and responsibilities..."
              />
              <p className="text-sm text-muted-foreground">Describe your key responsibilities and achievements</p>
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addExperience}>
        + Add Experience
      </Button>

      {localExperiences.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No experience entries yet. Click &ldquo;Add Experience&rdquo; to get started.
        </p>
      )}
    </div>
  );
}
