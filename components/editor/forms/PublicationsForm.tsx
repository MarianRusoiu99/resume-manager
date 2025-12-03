"use client";

import { SimpleFormField } from "@/components/ui/simple-form-field";
import type { Publication } from "@/lib/validations/jsonresume";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";

interface PublicationsFormProps {
  publications: Publication[];
  onChange: (publications: Publication[]) => void;
}

export function PublicationsForm({ publications, onChange }: PublicationsFormProps) {
  const { items, addItem, removeItem, updateItem } = useListForm<Publication>({
    initialItems: publications,
    onChange,
    newItemTemplate: {
      name: "",
      publisher: "",
      releaseDate: "",
      url: "",
      summary: "",
    },
  });

  return (
    <FormList
      items={items}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText="Add Publication"
      emptyMessage="No publications added yet. Click 'Add Publication' to showcase your work."
      renderItem={(pub, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SimpleFormField
            id={`publication-name-${index}`}
            label="Publication Name"
            value={pub.name || ""}
            onChange={(value) => updateItem(index, "name", value)}
            placeholder="Research Paper Title"
            required
          />

          <SimpleFormField
            id={`publication-publisher-${index}`}
            label="Publisher"
            value={pub.publisher || ""}
            onChange={(value) => updateItem(index, "publisher", value)}
            placeholder="Journal Name or Publisher"
            required
          />

          <SimpleFormField
            id={`publication-releaseDate-${index}`}
            label="Release Date"
            value={pub.releaseDate || ""}
            onChange={(value) => updateItem(index, "releaseDate", value)}
            type="date"
          />

          <SimpleFormField
            id={`publication-url-${index}`}
            label="URL"
            value={pub.url || ""}
            onChange={(value) => updateItem(index, "url", value)}
            type="url"
            placeholder="https://publication-url.com"
          />

          <div className="sm:col-span-2">
            <SimpleFormField
              id={`publication-summary-${index}`}
              label="Summary"
              value={pub.summary || ""}
              onChange={(value) => updateItem(index, "summary", value)}
              type="textarea"
              rows={3}
              placeholder="Brief description of the publication and its significance"
            />
          </div>
        </div>
      )}
    />
  );
}
