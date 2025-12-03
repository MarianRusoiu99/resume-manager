"use client";

import { SimpleFormField, SimpleFormFieldList } from "@/components/ui/simple-form-field";
import { useListForm } from "@/hooks/use-list-form";
import { FormList } from "@/components/ui/form-list";
import type { FieldConfig, FormSchema } from "@/lib/forms/form-schema";
import { isFullWidth } from "@/lib/forms/form-schema";

interface GenericFormListProps<T> {
  /** Form schema defining fields and templates */
  readonly schema: FormSchema<T>;
  /** Current items */
  readonly items: T[];
  /** Callback when items change */
  readonly onChange: (items: T[]) => void;
}

/**
 * GenericFormList - Renders a dynamic list form from a schema
 * 
 * This component reduces boilerplate by generating form fields from a schema.
 * Each form section (Experience, Education, etc.) can use the same component
 * with different schemas.
 * 
 * @example
 * ```tsx
 * import { experienceFormSchema } from '@/lib/forms/form-schema';
 * 
 * <GenericFormList
 *   schema={experienceFormSchema}
 *   items={experiences}
 *   onChange={setExperiences}
 * />
 * ```
 */
export function GenericFormList<T extends Record<string, unknown>>({
  schema,
  items,
  onChange,
}: GenericFormListProps<T>) {
  const { items: currentItems, addItem, removeItem, updateItem } = useListForm<T>({
    initialItems: items,
    onChange,
    newItemTemplate: schema.newItemTemplate,
  });

  return (
    <FormList
      items={currentItems}
      onAdd={addItem}
      onRemove={removeItem}
      addButtonText={schema.labels?.addButton || "Add Item"}
      emptyMessage={schema.labels?.emptyMessage || "No items yet."}
      renderItem={(item, index) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {schema.fields.map((field) => (
            <div
              key={String(field.key)}
              className={isFullWidth(field) ? "sm:col-span-2" : undefined}
            >
              <FieldRenderer
                field={field}
                item={item}
                index={index}
                onUpdate={(key, value) => updateItem(index, key, value as T[keyof T])}
              />
            </div>
          ))}
        </div>
      )}
    />
  );
}

interface FieldRendererProps<T> {
  field: FieldConfig<T>;
  item: T;
  index: number;
  onUpdate: (key: keyof T, value: unknown) => void;
}

function FieldRenderer<T extends Record<string, unknown>>({
  field,
  item,
  index,
  onUpdate,
}: Readonly<FieldRendererProps<T>>) {
  const value = item[field.key];
  const stringValue = value === null || value === undefined ? '' : String(value);
  const arrayValue = Array.isArray(value) ? value : [];

  switch (field.type) {
    case 'list':
      return (
        <SimpleFormFieldList
          id={`${String(field.key)}-${index}`}
          label={field.label}
          value={arrayValue as string[]}
          onChange={(newValue) => onUpdate(field.key, newValue)}
          separator={field.separator || 'newline'}
          type="textarea"
          rows={field.rows || 3}
          placeholder={field.placeholder}
          description={field.description}
        />
      );

    case 'select':
      return (
        <SimpleFormField
          id={`${String(field.key)}-${index}`}
          label={field.label}
          value={stringValue}
          onChange={(newValue) => onUpdate(field.key, newValue)}
          type="select"
          options={field.options}
          required={field.required}
          description={field.description}
        />
      );

    case 'textarea':
      return (
        <SimpleFormField
          id={`${String(field.key)}-${index}`}
          label={field.label}
          value={stringValue}
          onChange={(newValue) => onUpdate(field.key, newValue)}
          type="textarea"
          rows={field.rows || 3}
          placeholder={field.placeholder}
          description={field.description}
          required={field.required}
        />
      );

    case 'date':
    case 'month':
    default:
      return (
        <SimpleFormField
          id={`${String(field.key)}-${index}`}
          label={field.label}
          value={stringValue}
          onChange={(newValue) => onUpdate(field.key, newValue)}
          type={field.type}
          placeholder={field.placeholder}
          description={field.description}
          required={field.required}
        />
      );
  }
}

export default GenericFormList;
