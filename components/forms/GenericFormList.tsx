"use client";

import { SimpleFormField, SimpleFormFieldList } from "@/components/ui/simple-form-field";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";
import type { FieldConfig, FormSchema } from "@/lib/forms/form-schema";
import { isFullWidth } from "@/lib/forms/form-schema";

import { useAutoSave } from "@/hooks/useAutoSave";

import { GenericForm } from "./GenericForm";

interface GenericFormListProps<T> {
  /** Form schema defining fields and templates */
  readonly schema: FormSchema<T>;
  /** Current items */
  readonly items: T[];
  /** Callback when items change */
  readonly onChange: (items: T[]) => void;
  /** Whether auto-save is enabled */
  readonly autoSave?: boolean;
}

/**
 * GenericFormList - Renders a dynamic list form from a schema
 */
export function GenericFormList<T extends Record<string, any>>({
  schema,
  items,
  onChange,
  autoSave = true,
}: GenericFormListProps<T>) {
  const { items: currentItems, addItem, removeItem, updateItem } = useListForm<T>({
    initialItems: items,
    onChange,
    newItemTemplate: schema.newItemTemplate,
  });

  // Use the new auto-save hook to ensure consistent debouncing across all lists
  useAutoSave({
    data: items,
    onSave: async (data) => {
      // Logic for saving is usually handled by the parent EditorContext
    },
    enabled: autoSave,
    delay: 1000,
  });

  return (
    <FormList
      items={currentItems}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText={schema.labels?.addButton || "Add Item"}
      emptyMessage={schema.labels?.emptyMessage || "No items yet."}
      renderItem={(item, index) => (
        <GenericForm
          fields={schema.fields}
          data={item}
          onChange={(updatedItem) => {
              // Update each field to maintain the updateItem logic if needed, 
              // but here we can just replace the whole item in the list
              const keys = Object.keys(updatedItem) as (keyof T)[];
              keys.forEach(key => {
                  if (updatedItem[key] !== item[key]) {
                      updateItem(index, key, updatedItem[key]);
                  }
              });
          }}
        />
      )}
    />
  );
}

export default GenericFormList;
