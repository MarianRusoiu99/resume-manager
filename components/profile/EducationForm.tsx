"use client";

import { useState } from "react";
import { Input, Textarea, Button } from "@/components/ui";
import { Education } from "@/lib/validations/profile";

interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export function EducationForm({ education, onChange }: EducationFormProps) {
  const [localEducation, setLocalEducation] = useState<Education[]>(
    education.length > 0 ? education : []
  );

  const addEducation = () => {
    const newEducation: Education = {
      school: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
    };
    const updated = [...localEducation, newEducation];
    setLocalEducation(updated);
    onChange(updated);
  };

  const removeEducation = (index: number) => {
    const updated = localEducation.filter((_, i) => i !== index);
    setLocalEducation(updated);
    onChange(updated);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = localEducation.map((edu, i) => {
      if (i === index) {
        return { ...edu, [field]: value };
      }
      return edu;
    });
    setLocalEducation(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {localEducation.map((edu, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg space-y-4 relative"
        >
          {/* Remove Button */}
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => removeEducation(index)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="School/University *"
              value={edu.school}
              onChange={(e) => updateEducation(index, "school", e.target.value)}
              required
            />

            <Input
              label="Degree *"
              value={edu.degree}
              onChange={(e) => updateEducation(index, "degree", e.target.value)}
              placeholder="e.g., Bachelor of Science"
              required
            />

            <Input
              label="Field of Study"
              value={edu.field}
              onChange={(e) => updateEducation(index, "field", e.target.value)}
              placeholder="e.g., Computer Science"
            />

            <Input
              label="GPA"
              value={edu.gpa}
              onChange={(e) => updateEducation(index, "gpa", e.target.value)}
              placeholder="e.g., 3.8/4.0"
            />

            <Input
              label="Start Date"
              type="month"
              value={edu.startDate}
              onChange={(e) => updateEducation(index, "startDate", e.target.value)}
            />

            <Input
              label="End Date"
              type="month"
              value={edu.endDate}
              onChange={(e) => updateEducation(index, "endDate", e.target.value)}
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                value={edu.description}
                onChange={(e) => updateEducation(index, "description", e.target.value)}
                rows={3}
                placeholder="Honors, relevant coursework, activities..."
                helperText="Optional: Add relevant details about your education"
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={addEducation}>
        + Add Education
      </Button>

      {localEducation.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          No education entries yet. Click &ldquo;Add Education&rdquo; to get started.
        </p>
      )}
    </div>
  );
}
