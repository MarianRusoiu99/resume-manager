"use client";

import { SimpleFormField } from "@/components/ui/simple-form-field";
import type { Reference } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface ReferencesFormProps {
  references: Reference[];
  onChange: (references: Reference[]) => void;
}

export function ReferencesForm({ references, onChange }: ReferencesFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Reference>({
    initialItems: references,
    onChange,
    newItemTemplate: {
      name: "",
      reference: "",
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Reference"
      emptyMessage="No references added yet. Click 'Add Reference' to get started."
      renderItem={(ref, index) => (
        <div className="grid grid-cols-1 gap-4">
          <SimpleFormField
            id={`reference-name-${index}`}
            label="Reference Name"
            value={ref.name || ""}
            onChange={(value) => updateItem(index, "name", value)}
            placeholder="John Doe"
            required
          />

          <SimpleFormField
            id={`reference-reference-${index}`}
            label="Reference Statement"
            value={ref.reference || ""}
            onChange={(value) => updateItem(index, "reference", value)}
            type="textarea"
            rows={4}
            placeholder="John is an excellent developer with strong problem-solving skills..."
            required
          />
        </div>
      )}
    />
  );
}
