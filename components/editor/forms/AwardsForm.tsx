"use client";

import { SimpleFormField } from "@/components/ui/simple-form-field";
import type { Award } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface AwardsFormProps {
  awards: Award[];
  onChange: (awards: Award[]) => void;
}

export function AwardsForm({ awards, onChange }: AwardsFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Award>({
    initialItems: awards,
    onChange,
    newItemTemplate: {
      title: "",
      date: "",
      awarder: "",
      summary: "",
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Award"
      emptyMessage="No awards added yet. Click 'Add Award' to showcase your achievements."
      renderItem={(award, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SimpleFormField
            id={`award-title-${index}`}
            label="Award Title"
            value={award.title || ""}
            onChange={(value) => updateItem(index, "title", value)}
            placeholder="Employee of the Year"
            required
          />

          <SimpleFormField
            id={`award-awarder-${index}`}
            label="Awarded By"
            value={award.awarder || ""}
            onChange={(value) => updateItem(index, "awarder", value)}
            placeholder="Company Name"
            required
          />

          <SimpleFormField
            id={`award-date-${index}`}
            label="Date Received"
            value={award.date || ""}
            onChange={(value) => updateItem(index, "date", value)}
            type="date"
          />

          <div className="sm:col-span-2">
            <SimpleFormField
              id={`award-summary-${index}`}
              label="Summary"
              value={award.summary || ""}
              onChange={(value) => updateItem(index, "summary", value)}
              type="textarea"
              rows={3}
              placeholder="Brief description of the award and what it recognizes"
            />
          </div>
        </div>
      )}
    />
  );
}
