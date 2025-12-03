"use client";

import { SimpleFormField, SimpleFormFieldList } from "@/components/ui/simple-form-field";
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
          <SimpleFormField
            id={`institution-${index}`}
            label="School/University"
            value={edu.institution || ""}
            onChange={(value) => updateItem(index, "institution", value)}
            required
          />

          <SimpleFormField
            id={`studyType-${index}`}
            label="Degree"
            value={edu.studyType || ""}
            onChange={(value) => updateItem(index, "studyType", value)}
            placeholder="e.g., Bachelor of Science"
            required
          />

          <SimpleFormField
            id={`area-${index}`}
            label="Field of Study"
            value={edu.area || ""}
            onChange={(value) => updateItem(index, "area", value)}
            placeholder="e.g., Computer Science"
          />

          <SimpleFormField
            id={`score-${index}`}
            label="GPA"
            value={edu.score || ""}
            onChange={(value) => updateItem(index, "score", value)}
            placeholder="e.g., 3.8/4.0"
          />

          <SimpleFormField
            id={`start-date-${index}`}
            label="Start Date"
            value={edu.startDate || ""}
            onChange={(value) => updateItem(index, "startDate", value)}
            type="month"
          />

          <SimpleFormField
            id={`end-date-${index}`}
            label="End Date"
            value={edu.endDate || ""}
            onChange={(value) => updateItem(index, "endDate", value)}
            type="month"
          />

          <div className="sm:col-span-2">
            <SimpleFormFieldList
              id={`courses-${index}`}
              label="Relevant Courses"
              value={edu.courses || []}
              onChange={(value) => updateItem(index, "courses", value)}
              separator="comma"
              type="textarea"
              rows={3}
              placeholder="Comma-separated list of courses..."
              description="Optional: Add relevant coursework"
            />
          </div>
        </div>
      )}
    />
  );
}
