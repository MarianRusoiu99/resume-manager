"use client";

import { SimpleFormField, SimpleFormFieldList } from "@/components/ui/simple-form-field";
import type { FieldConfig } from "@/lib/forms/form-schema";
import { isFullWidth } from "@/lib/forms/form-schema";

interface GenericFormProps<T> {
  /** Form fields configuration */
  readonly fields: FieldConfig<T>[];
  /** Current data */
  readonly data: T;
  /** Callback when data changes */
  readonly onChange: (data: T) => void;
  /** Additional className */
  readonly className?: string;
  /** Number of columns (default: 2) */
  readonly columns?: 1 | 2;
  /** Whether fields are disabled */
  readonly disabled?: boolean;
}

/**
 * GenericForm - Renders a single dynamic form from fields configuration
 * 
 * Similar to GenericFormList but for single objects.
 */
export function GenericForm<T extends Record<string, unknown>>({
  fields,
  data,
  onChange,
  className,
  columns = 2,
  disabled = false,
}: GenericFormProps<T>) {
  
  const updateField = (key: keyof T, value: T[keyof T]) => {
    onChange({
      ...data,
      [key]: value,
    });
  };

  return (
    <div className={className}>
      <div className={`grid grid-cols-1 gap-4 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
        {fields.map((field) => (
          <div
            key={String(field.key)}
            className={isFullWidth(field) ? "sm:col-span-2" : undefined}
          >
            <FieldRenderer
              field={field}
              value={data[field.key]}
              onUpdate={(value) => updateField(field.key, value as T[keyof T])}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface FieldRendererProps<T> {
  field: FieldConfig<T>;
  value: unknown;
  onUpdate: (value: unknown) => void;
  disabled?: boolean;
}

function FieldRenderer<T extends Record<string, unknown>>({
  field,
  value,
  onUpdate,
  disabled,
}: FieldRendererProps<T>) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  const arrayValue = Array.isArray(value) ? value : [];

  switch (field.type) {
    case 'list':
      return (
        <SimpleFormFieldList
          id={String(field.key)}
          label={field.label}
          value={arrayValue as string[]}
          onChange={onUpdate}
          separator={field.separator || 'newline'}
          type="textarea"
          rows={field.rows || 3}
          placeholder={field.placeholder}
          description={field.description}
          disabled={disabled}
        />
      );

    case 'select':
      return (
        <SimpleFormField
          id={String(field.key)}
          label={field.label}
          value={stringValue}
          onChange={onUpdate}
          type="select"
          options={field.options}
          required={field.required}
          description={field.description}
          disabled={disabled}
        />
      );

    case 'textarea':
      return (
        <SimpleFormField
          id={String(field.key)}
          label={field.label}
          value={stringValue}
          onChange={onUpdate}
          type="textarea"
          rows={field.rows || 3}
          placeholder={field.placeholder}
          description={field.description}
          required={field.required}
          disabled={disabled}
        />
      );

    default:
      return (
        <SimpleFormField
          id={String(field.key)}
          label={field.label}
          value={stringValue}
          onChange={onUpdate}
          type={field.type as "text" | "email" | "tel" | "url" | "password"}
          placeholder={field.placeholder}
          description={field.description}
          required={field.required}
          disabled={disabled}
        />
      );
  }
}
