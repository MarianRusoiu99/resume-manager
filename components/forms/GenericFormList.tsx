"use client";

import { memo, useCallback } from "react";
import { useListForm } from "@/hooks/useListForm";
import { FormList } from "@/components/ui/form-list";
import type { FormSchema } from "@/lib/forms/form-schema";

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
function GenericFormListComponent<T extends Record<string, unknown>>({
  schema,
  items,
  onChange,
  autoSave = true,
}: Readonly<GenericFormListProps<T>>) {
  const { items: currentItems, addItem, removeItem, updateItem } = useListForm<T>({
    initialItems: items,
    onChange,
    newItemTemplate: schema.newItemTemplate,
  });

  // Use the new auto-save hook to ensure consistent debouncing across all lists
  useAutoSave({
    data: items,
    onSave: async () => {
      // Logic for saving is usually handled by the parent EditorContext
    },
    enabled: autoSave,
    delay: 1000,
  });

  const handleItemChange = useCallback((updatedItem: T, index: number, item: T) => {
    // Update each field to maintain the updateItem logic if needed, 
    // but here we can just replace the whole item in the list
    const keys = Object.keys(updatedItem) as (keyof T)[];
    keys.forEach(key => {
        if (updatedItem[key] !== item[key]) {
            updateItem(index, key, updatedItem[key]);
        }
    });
  }, [updateItem]);

  return (
    <FormList
      items={currentItems}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText={schema.labels?.addButton || "Add Item"}
      emptyMessage={schema.labels?.emptyMessage || "No items yet."}
      renderItem={(item: any, index: number) => (
        <GenericForm
          fields={schema.fields as any}
          data={item as any}
          onChange={(updatedItem: any) => handleItemChange(updatedItem, index, item)}
        />
      )}
    />
  );
}

export const GenericFormList = memo(GenericFormListComponent) as typeof GenericFormListComponent;

export default GenericFormList;
