"use client";

import { useCallback, memo } from "react";
import type { FieldConfig } from "@/lib/forms/form-schema";
import { isFullWidth } from "@/lib/forms/form-schema";
import { FieldRenderer } from "./generic-form/FieldRenderer";

interface GenericFormProps<T> {
  readonly fields: FieldConfig<T>[];
  readonly data: T;
  readonly onChange: (data: T) => void;
  readonly className?: string;
  readonly columns?: 1 | 2;
  readonly disabled?: boolean;
}

function GenericFormComponent<T extends Record<string, unknown>>({
  fields,
  data,
  onChange,
  className,
  columns = 2,
  disabled = false,
}: GenericFormProps<T>) {
  
  const updateField = useCallback((key: keyof T, value: T[keyof T]) => {
    onChange({
      ...data,
      [key]: value,
    });
  }, [data, onChange]);

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

export const GenericForm = memo(GenericFormComponent) as typeof GenericFormComponent;
