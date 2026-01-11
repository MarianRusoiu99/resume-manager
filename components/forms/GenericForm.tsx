"use client";

import { useCallback, memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { SimpleFormField } from "@/components/ui/simple-form-field";
import { TagInput } from "@/components/ui/tag-input";
import type { FieldConfig, RichTextFieldConfig } from "@/lib/forms/form-schema";
import { isFullWidth } from "@/lib/forms/form-schema";

// Dynamically import RichTextField to avoid SSR issues with BlockNote
const RichTextField = dynamic(
  () => import("@/components/ui/rich-text-field").then((mod) => mod.RichTextField),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[100px] p-3 flex items-center justify-center text-muted-foreground border rounded-md bg-muted/20">
        Loading editor...
      </div>
    ),
  }
);

/**
 * Convert a string array to markdown bullet list
 */
function arrayToMarkdown(arr: string[]): string {
  if (!arr || arr.length === 0) return '';
  return arr.map(item => `- ${item}`).join('\n');
}

/**
 * Convert markdown (potentially with bullet points) back to string array
 * Handles both bullet lists and plain text (split by newlines)
 */
function markdownToArray(markdown: string): string[] {
  if (!markdown || !markdown.trim()) return [];
  
  const lines = markdown.split('\n');
  return lines
    .map(line => {
      // Remove bullet point markers (-, *, or numbered lists)
      return line.replace(/^[\s]*[-*]\s*/, '').replace(/^[\s]*\d+\.\s*/, '').trim();
    })
    .filter(line => line.length > 0);
}

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
  const isArrayValue = Array.isArray(value);
  const arrayValue = isArrayValue ? value : [];
  
  // For richtext fields, convert array to markdown if the value is an array
  const stringValue = useMemo(() => {
    if (value === null || value === undefined) return '';
    if (isArrayValue) {
      // Convert array to markdown bullet list for richtext editing
      return arrayToMarkdown(arrayValue as string[]);
    }
    return String(value);
  }, [value, isArrayValue, arrayValue]);

  // Handle richtext change - convert back to array if original value was array
  const handleRichtextChange = useCallback((newMarkdown: string) => {
    if (isArrayValue) {
      // Convert markdown back to array
      onUpdate(markdownToArray(newMarkdown));
    } else {
      onUpdate(newMarkdown);
    }
  }, [isArrayValue, onUpdate]);

  switch (field.type) {
    case 'richtext':
      return (
        <RichTextField
          id={String(field.key)}
          label={field.label}
          value={stringValue}
          onChange={handleRichtextChange}
          placeholder={field.placeholder}
          description={field.description}
          required={field.required}
          minHeight={(field as RichTextFieldConfig<T>).minHeight}
          disabled={disabled}
        />
      );

    case 'tags':
      return (
        <TagInput
          id={String(field.key)}
          label={field.label}
          value={arrayValue as string[]}
          onChange={(tags) => onUpdate(tags)}
          placeholder={field.placeholder}
          description={field.description}
          required={field.required}
          disabled={disabled}
        />
      );

    case 'select':
      return (
        <SimpleFormField
          id={String(field.key)}
          label={field.label}
          value={isArrayValue ? '' : stringValue}
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
          value={isArrayValue ? '' : stringValue}
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
          value={isArrayValue ? '' : stringValue}
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
