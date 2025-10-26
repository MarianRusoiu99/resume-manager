"use client";

import { useState } from "react";
import { Input, Textarea, Button } from "@/components/ui";
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
            <Input
              label="Company *"
              value={experience.company}
              onChange={(e) => updateExperience(index, "company", e.target.value)}
              required
            />

            <Input
              label="Job Title *"
              value={experience.title}
              onChange={(e) => updateExperience(index, "title", e.target.value)}
              required
            />

            <Input
              label="Start Date *"
              type="month"
              value={experience.startDate}
              onChange={(e) => updateExperience(index, "startDate", e.target.value)}
              required
            />

            <Input
              label="End Date"
              type="month"
              value={experience.endDate}
              onChange={(e) => updateExperience(index, "endDate", e.target.value)}
              disabled={experience.current}
            />

            <div className="sm:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={experience.current}
                  onChange={(e) => {
                    updateExperience(index, "current", e.target.checked);
                    if (e.target.checked) {
                      updateExperience(index, "endDate", "");
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I currently work here
                </span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                value={experience.description}
                onChange={(e) => updateExperience(index, "description", e.target.value)}
                rows={4}
                placeholder="Describe your role and responsibilities..."
                helperText="Describe your key responsibilities and achievements"
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={addExperience}>
        + Add Experience
      </Button>

      {localExperiences.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          No experience entries yet. Click &ldquo;Add Experience&rdquo; to get started.
        </p>
      )}
    </div>
  );
}
