"use client";

import { SimpleFormField } from "@/components/ui/simple-form-field";
import type { Language } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface LanguagesFormProps {
  languages: Language[];
  onChange: (languages: Language[]) => void;
}

const FLUENCY_OPTIONS = [
  { value: "Native speaker", label: "Native / Bilingual" },
  { value: "Fluent", label: "Fluent" },
  { value: "Professional working proficiency", label: "Professional" },
  { value: "Limited working proficiency", label: "Intermediate" },
  { value: "Elementary proficiency", label: "Basic" },
];

export default function LanguagesForm({
  languages = [],
  onChange,
}: LanguagesFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Language>({
    initialItems: languages,
    onChange,
    newItemTemplate: {
      language: "",
      fluency: "Limited working proficiency",
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Language"
      emptyMessage="No languages added yet. Click 'Add Language' to get started."
      renderItem={(lang, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SimpleFormField
            id={`language-${index}`}
            label="Language"
            value={lang.language || ""}
            onChange={(value) => updateItem(index, "language", value)}
            placeholder="e.g., Spanish, Mandarin, French"
            required
          />

          <SimpleFormField
            id={`fluency-${index}`}
            label="Fluency Level"
            value={lang.fluency || ""}
            onChange={(value) => updateItem(index, "fluency", value)}
            type="select"
            options={FLUENCY_OPTIONS}
            required
          />
        </div>
      )}
    />
  );
}
