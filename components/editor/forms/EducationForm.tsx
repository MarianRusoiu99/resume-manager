"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Education } from "@/lib/validations/jsonresume";

interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export function EducationForm({ education, onChange }: EducationFormProps) {
  // Use education directly from props - controlled component pattern
  const localEducation = education.length > 0 ? education : [];

  const addEducation = () => {
    const newEducation: Education = {
      institution: "",
      studyType: "",
      area: "",
      startDate: "",
      endDate: "",
      score: "",
      courses: [],
    };
    onChange([...localEducation, newEducation]);
  };

  const removeEducation = (index: number) => {
    onChange(localEducation.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof NonNullable<Education>, value: string | string[]) => {
    const updated = localEducation.map((edu, i) => {
      if (i === index && edu) {
        return { ...edu, [field]: value };
      }
      return edu;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {localEducation.filter(edu => edu).map((edu, index) => (
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
            <div className="space-y-2">
              <Label htmlFor={`institution-${index}`}>School/University *</Label>
              <Input
                id={`institution-${index}`}
                value={edu!.institution || ""}
                onChange={(e) => updateEducation(index, "institution", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`studyType-${index}`}>Degree *</Label>
              <Input
                id={`studyType-${index}`}
                value={edu!.studyType || ""}
                onChange={(e) => updateEducation(index, "studyType", e.target.value)}
                placeholder="e.g., Bachelor of Science"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`area-${index}`}>Field of Study</Label>
              <Input
                id={`area-${index}`}
                value={edu!.area || ""}
                onChange={(e) => updateEducation(index, "area", e.target.value)}
                placeholder="e.g., Computer Science"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`score-${index}`}>GPA</Label>
              <Input
                id={`score-${index}`}
                value={edu!.score || ""}
                onChange={(e) => updateEducation(index, "score", e.target.value)}
                placeholder="e.g., 3.8/4.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`start-date-${index}`}>Start Date</Label>
              <Input
                id={`start-date-${index}`}
                type="month"
                value={edu!.startDate || ""}
                onChange={(e) => updateEducation(index, "startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`end-date-${index}`}>End Date</Label>
              <Input
                id={`end-date-${index}`}
                type="month"
                value={edu!.endDate || ""}
                onChange={(e) => updateEducation(index, "endDate", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor={`courses-${index}`}>Relevant Courses</Label>
              <Textarea
                id={`courses-${index}`}
                value={edu!.courses?.join(", ") || ""}
                onChange={(e) => {
                  const coursesArray = e.target.value.split(",").map(c => c.trim()).filter(c => c);
                  updateEducation(index, "courses", coursesArray);
                }}
                rows={3}
                placeholder="Comma-separated list of courses..."
              />
              <p className="text-sm text-muted-foreground">Optional: Add relevant coursework</p>
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addEducation}>
        + Add Education
      </Button>

      {localEducation.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No education entries yet. Click &ldquo;Add Education&rdquo; to get started.
        </p>
      )}
    </div>
  );
}
