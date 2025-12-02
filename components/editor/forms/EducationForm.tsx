"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Education } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export function EducationForm({ education, onChange }: EducationFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Education>({
    initialItems: education,
    onChange,
    newItemTemplate: {
      institution: "",
      studyType: "",
      area: "",
      startDate: "",
      endDate: "",
      score: "",
      courses: [],
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Education"
      emptyMessage="No education entries yet. Click 'Add Education' to get started."
      renderItem={(edu, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`institution-${index}`}>School/University *</Label>
            <Input
              id={`institution-${index}`}
              value={edu.institution || ""}
              onChange={(e) => updateItem(index, "institution", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`studyType-${index}`}>Degree *</Label>
            <Input
              id={`studyType-${index}`}
              value={edu.studyType || ""}
              onChange={(e) => updateItem(index, "studyType", e.target.value)}
              placeholder="e.g., Bachelor of Science"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`area-${index}`}>Field of Study</Label>
            <Input
              id={`area-${index}`}
              value={edu.area || ""}
              onChange={(e) => updateItem(index, "area", e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`score-${index}`}>GPA</Label>
            <Input
              id={`score-${index}`}
              value={edu.score || ""}
              onChange={(e) => updateItem(index, "score", e.target.value)}
              placeholder="e.g., 3.8/4.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`start-date-${index}`}>Start Date</Label>
            <Input
              id={`start-date-${index}`}
              type="month"
              value={edu.startDate || ""}
              onChange={(e) => updateItem(index, "startDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`end-date-${index}`}>End Date</Label>
            <Input
              id={`end-date-${index}`}
              type="month"
              value={edu.endDate || ""}
              onChange={(e) => updateItem(index, "endDate", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor={`courses-${index}`}>Relevant Courses</Label>
            <Textarea
              id={`courses-${index}`}
              value={edu.courses?.join(", ") || ""}
              onChange={(e) => {
                const coursesArray = e.target.value.split(",").map(c => c.trim()).filter(c => c);
                updateItem(index, "courses", coursesArray);
              }}
              rows={3}
              placeholder="Comma-separated list of courses..."
            />
            <p className="text-sm text-muted-foreground">Optional: Add relevant coursework</p>
          </div>
        </div>
      )}
    />
  );
}
