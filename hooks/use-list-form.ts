import { useCallback, useMemo } from "react";

export interface UseListFormProps<T> {
  /** Initial items - this is the source of truth (controlled component) */
  initialItems?: T[];
  /** Callback when items change */
  onChange: (items: T[]) => void;
  /** Template for creating new items */
  newItemTemplate: T;
}

export interface UseListFormReturn<T> {
  /** Current list of items */
  items: T[];
  /** Add a new item using the template */
  addItem: () => void;
  /** Remove item at index */
  removeItem: (index: number) => void;
  /** Update a specific field of an item */
  updateItem: <K extends keyof T>(index: number, field: K, value: T[K]) => void;
  /** Update multiple fields of an item at once */
  updateItemFields: (index: number, updates: Partial<T>) => void;
  /** Move an item from one index to another */
  moveItem: (fromIndex: number, toIndex: number) => void;
  /** Duplicate an item at index */
  duplicateItem: (index: number) => void;
  /** Check if list is empty */
  isEmpty: boolean;
  /** Number of items in the list */
  count: number;
}

/**
 * useListForm - Hook for managing dynamic form lists
 * 
 * This hook provides utilities for managing arrays of form items with
 * add, remove, update, move, and duplicate operations.
 * 
 * @example
 * ```tsx
 * const { items, addItem, removeItem, updateItem } = useListForm<Education>({
 *   initialItems: education,
 *   onChange,
 *   newItemTemplate: { institution: "", degree: "" },
 * });
 * 
 * return (
 *   <FormList items={items} onAdd={addItem} onRemove={removeItem}>
 *     {(item, index) => (
 *       <SimpleFormField
 *         id={`institution-${index}`}
 *         label="Institution"
 *         value={item.institution}
 *         onChange={(value) => updateItem(index, "institution", value)}
 *       />
 *     )}
 *   </FormList>
 * );
 * ```
 */
export function useListForm<T>({
  initialItems = [],
  onChange,
  newItemTemplate,
}: UseListFormProps<T>): UseListFormReturn<T> {
  // Use provided items as source of truth (controlled component)
  const items = useMemo(
    () => (initialItems.length > 0 ? initialItems : []),
    [initialItems]
  );

  const addItem = useCallback(() => {
    // Deep clone the template to avoid shared references
    const newItem = JSON.parse(JSON.stringify(newItemTemplate)) as T;
    onChange([...items, newItem]);
  }, [items, newItemTemplate, onChange]);

  const removeItem = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange]
  );

  const updateItem = useCallback(
    <K extends keyof T>(index: number, field: K, value: T[K]) => {
      if (index < 0 || index >= items.length) return;
      const updated = items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      onChange(updated);
    },
    [items, onChange]
  );

  const updateItemFields = useCallback(
    (index: number, updates: Partial<T>) => {
      if (index < 0 || index >= items.length) return;
      const updated = items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      );
      onChange(updated);
    },
    [items, onChange]
  );

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        fromIndex < 0 ||
        fromIndex >= items.length ||
        toIndex < 0 ||
        toIndex >= items.length ||
        fromIndex === toIndex
      ) {
        return;
      }
      const updated = [...items];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      onChange(updated);
    },
    [items, onChange]
  );

  const duplicateItem = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      // Deep clone to avoid shared references
      const duplicated = JSON.parse(JSON.stringify(items[index])) as T;
      const updated = [...items];
      updated.splice(index + 1, 0, duplicated);
      onChange(updated);
    },
    [items, onChange]
  );

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    updateItemFields,
    moveItem,
    duplicateItem,
    isEmpty: items.length === 0,
    count: items.length,
  };
}
