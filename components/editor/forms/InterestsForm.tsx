"use client";

import { SimpleFormField, SimpleFormFieldList } from "@/components/ui/simple-form-field";
import type { Interest } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface InterestsFormProps {
  interests: Interest[];
  onChange: (interests: Interest[]) => void;
}

export function InterestsForm({ interests, onChange }: InterestsFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Interest>({
    initialItems: interests,
    onChange,
    newItemTemplate: {
      name: "",
      keywords: [],
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Interest"
      emptyMessage="No interests added yet. Click 'Add Interest' to get started."
      renderItem={(interest, index) => (
        <div className="grid grid-cols-1 gap-4">
          <SimpleFormField
            id={`interest-name-${index}`}
            label="Interest Name"
            value={interest.name || ""}
            onChange={(value) => updateItem(index, "name", value)}
            placeholder="Photography, Hiking, Open Source, etc."
            required
          />

          <SimpleFormFieldList
            id={`interest-keywords-${index}`}
            label="Related Keywords"
            value={interest.keywords || []}
            onChange={(value) => updateItem(index, "keywords", value)}
            separator="newline"
            type="textarea"
            rows={4}
            placeholder="Landscape&#10;Wildlife&#10;Portrait"
            description="One keyword per line"
          />
        </div>
      )}
    />
  );
}
