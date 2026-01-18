"use client";

import { useCallback, memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { SimpleFormField } from "@/components/ui/simple-form-field";
import { TagInput } from "@/components/ui/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Globe, User as UserIcon, Link as LinkIcon } from "lucide-react";
import type { FieldConfig, RichTextFieldConfig } from "@/lib/forms/form-schema";
import { isFullWidth } from "@/lib/forms/form-schema";
import { cn } from "@/lib/utils";

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

interface ProfileListFieldProps {
  label: string;
  value: { network: string; username?: string; url?: string }[];
  onChange: (value: { network: string; username?: string; url?: string }[]) => void;
  description?: string;
  disabled?: boolean;
}

function ProfileListField({
  label,
  value,
  onChange,
  description,
  disabled,
}: ProfileListFieldProps) {
  const addProfile = () => {
    onChange([...value, { network: "", username: "", url: "" }]);
  };

  const removeProfile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateProfile = (index: number, field: string, newValue: string) => {
    const newProfiles = [...value];
    newProfiles[index] = { ...newProfiles[index], [field]: newValue };
    onChange(newProfiles);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProfile}
          disabled={disabled}
          className="h-8 gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Profile
        </Button>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="space-y-3">
        {value.map((profile, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 p-4 border rounded-lg bg-card/50 relative group"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeProfile(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                  <Globe className="h-3 w-3" />
                  Network
                </div>
                <Input
                  placeholder="e.g. LinkedIn, GitHub"
                  value={profile.network}
                  onChange={(e) => updateProfile(index, "network", e.target.value)}
                  disabled={disabled}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                  <UserIcon className="h-3 w-3" />
                  Username
                </div>
                <Input
                  placeholder="username"
                  value={profile.username}
                  onChange={(e) => updateProfile(index, "username", e.target.value)}
                  disabled={disabled}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                <LinkIcon className="h-3 w-3" />
                URL
              </div>
              <Input
                placeholder="https://..."
                value={profile.url}
                onChange={(e) => updateProfile(index, "url", e.target.value)}
                disabled={disabled}
                className="h-9"
              />
            </div>
          </div>
        ))}

        {value.length === 0 && (
          <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20">
            <p className="text-sm text-muted-foreground">No social profiles added yet.</p>
          </div>
        )}
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
  const isArrayValue = Array.isArray(value);
  const arrayValue = isArrayValue ? value : [];
  
  // For richtext fields, convert array to markdown if the value is an array
  const stringValue = useMemo(() => {
    if (value === null || value === undefined) return '';
    if (isArrayValue && field.type !== 'profiles') {
      // Convert array to markdown bullet list for richtext editing
      return arrayToMarkdown(arrayValue as string[]);
    }
    return String(value);
  }, [value, isArrayValue, arrayValue, field.type]);

  // Handle richtext change - convert back to array if original value was array
  const handleRichtextChange = useCallback((newMarkdown: string) => {
    if (isArrayValue && field.type !== 'profiles') {
      // Convert markdown back to array
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
          value={(value as any[]) || []}
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
          type={field.type as "text" | "email" | "tel" | "url" | "password"}
          placeholder={field.placeholder}
          description={field.description}
          required={field.required}
          disabled={disabled}
        />
      );
  }
}
