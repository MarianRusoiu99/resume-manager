"use client";

import { SimpleFormField, SimpleFormFieldList } from "@/components/ui/simple-form-field";
import { Work } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface ExperienceFormProps {
  experiences: Work[];
  onChange: (experiences: Work[]) => void;
}

export function ExperienceForm({ experiences, onChange }: ExperienceFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Work>({
    initialItems: experiences,
    onChange,
    newItemTemplate: {
      name: "",
      position: "",
      startDate: "",
      endDate: "",
      summary: "",
      highlights: [],
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Experience"
      emptyMessage="No experience entries yet. Click 'Add Experience' to get started."
      renderItem={(experience, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SimpleFormField
            id={`name-${index}`}
            label="Company"
            value={experience.name || ""}
            onChange={(value) => updateItem(index, "name", value)}
            required
          />

          <SimpleFormField
            id={`position-${index}`}
            label="Job Title"
            value={experience.position || ""}
            onChange={(value) => updateItem(index, "position", value)}
            required
          />

          <SimpleFormField
            id={`start-${index}`}
            label="Start Date"
            value={experience.startDate || ""}
            onChange={(value) => updateItem(index, "startDate", value)}
            type="month"
            required
          />

          <SimpleFormField
            id={`end-${index}`}
            label="End Date"
            value={experience.endDate || ""}
            onChange={(value) => updateItem(index, "endDate", value)}
            type="month"
            placeholder="Leave empty if current"
          />

          <div className="sm:col-span-2">
            <SimpleFormField
              id={`summary-${index}`}
              label="Summary"
              value={experience.summary || ""}
              onChange={(value) => updateItem(index, "summary", value)}
              type="textarea"
              rows={3}
              placeholder="Brief description of your role..."
              description="Describe your key responsibilities"
            />
          </div>

          <div className="sm:col-span-2">
            <SimpleFormFieldList
              id={`highlights-${index}`}
              label="Key Achievements"
              value={experience.highlights || []}
              onChange={(value) => updateItem(index, "highlights", value)}
              separator="newline"
              type="textarea"
              rows={4}
              placeholder="• Achievement 1&#10;• Achievement 2&#10;• Achievement 3"
              description="One achievement per line"
            />
          </div>
        </div>
      )}
    />
  );
}
