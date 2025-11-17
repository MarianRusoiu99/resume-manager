"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Experience } from "@/lib/validations/jsonresume";

interface ExperienceFormProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export function ExperienceForm({ experiences, onChange }: ExperienceFormProps) {
  // Use experiences directly from props - controlled component pattern
  const localExperiences = experiences.length > 0 ? experiences : [];

  const addExperience = () => {
    const newExperience: Experience = {
      name: "",
      position: "",
      startDate: "",
      endDate: "",
      summary: "",
      highlights: [],
    };
    onChange([...localExperiences, newExperience]);
  };

  const removeExperience = (index: number) => {
    onChange(localExperiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean | string[]) => {
    const updated = localExperiences.map((exp, i) => {
      if (i === index) {
        return { ...exp, [field]: value };
      }
      return exp;
    });
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
              <Label htmlFor={`name-${index}`}>Company *</Label>
              <Input
                id={`name-${index}`}
                value={experience.name || ""}
                onChange={(e) => updateExperience(index, "name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`position-${index}`}>Job Title *</Label>
              <Input
                id={`position-${index}`}
                value={experience.position || ""}
                onChange={(e) => updateExperience(index, "position", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`start-${index}`}>Start Date *</Label>
              <Input
                id={`start-${index}`}
                type="month"
                value={experience.startDate || ""}
                onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`end-${index}`}>End Date</Label>
              <Input
                id={`end-${index}`}
                type="month"
                value={experience.endDate || ""}
                onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                placeholder="Leave empty if current"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor={`summary-${index}`}>Summary</Label>
              <Textarea
                id={`summary-${index}`}
                value={experience.summary || ""}
                onChange={(e) => updateExperience(index, "summary", e.target.value)}
                rows={3}
                placeholder="Brief description of your role..."
              />
              <p className="text-sm text-muted-foreground">Describe your key responsibilities</p>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor={`highlights-${index}`}>Key Achievements</Label>
              <Textarea
                id={`highlights-${index}`}
                value={experience.highlights?.join("\n") || ""}
                onChange={(e) => {
                  const highlightsArray = e.target.value.split("\n").filter(h => h.trim());
                  updateExperience(index, "highlights", highlightsArray);
                }}
                rows={4}
                placeholder="• Achievement 1&#10;• Achievement 2&#10;• Achievement 3"
              />
              <p className="text-sm text-muted-foreground">One achievement per line</p>
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
