"use client";

import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { SimpleFormField } from "@/components/ui/simple-form-field";
import { TagInput } from "@/components/ui/tag-input";
import type { FieldConfig, RichTextFieldConfig } from "@/lib/forms/form-schema";
import { ProfileListField } from "./ProfileListField";

// Dynamically import RichTextField to avoid SSR issues with TipTap
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
 * Convert markdown back to string array
 */
function markdownToArray(markdown: string): string[] {
  if (!markdown || !markdown.trim()) return [];
  const lines = markdown.split('\n');
  return lines
    .map(line => line.replace(/^[\s]*[-*]\s*/, '').replace(/^[\s]*\d+\.\s*/, '').trim())
    .filter(line => line.length > 0);
}

interface FieldRendererProps<T> {
  field: FieldConfig<T>;
  value: unknown;
  onUpdate: (value: unknown) => void;
  disabled?: boolean;
}

export function FieldRenderer<T extends Record<string, unknown>>({
  field,
  value,
  onUpdate,
  disabled,
}: FieldRendererProps<T>) {
  const isArrayValue = Array.isArray(value);
  const arrayValue = isArrayValue ? value : [];
  
  const stringValue = useMemo(() => {
    if (value === null || value === undefined) return '';
    if (isArrayValue && field.type !== 'profiles') {
      return arrayToMarkdown(arrayValue as string[]);
    }
    return String(value);
  }, [value, isArrayValue, arrayValue, field.type]);

  const handleRichtextChange = useCallback((newMarkdown: string) => {
    if (isArrayValue && field.type !== 'profiles') {
      onUpdate(markdownToArray(newMarkdown));
    } else {
      onUpdate(newMarkdown);
    }
  }, [isArrayValue, onUpdate, field.type]);

  switch (field.type) {
    case 'profiles':
      return (
        <ProfileListField
          label={field.label}
          description={field.description}
          value={(value as { network: string; username?: string; url?: string }[]) || []}
          onChange={onUpdate}
          disabled={disabled}
        />
      );

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
          type={field.type as 'text' | 'email' | 'url' | 'tel' | 'password'}
          placeholder={field.placeholder}
          description={field.description}
          required={field.required}
          disabled={disabled}
        />
      );
  }
}
