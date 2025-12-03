"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SimpleFormFieldProps {
  /** Field name/id - used for accessibility */
  id: string;
  /** Label text */
  label: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Input type - defaults to "text" */
  type?: "text" | "email" | "tel" | "url" | "month" | "date" | "number" | "textarea";
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Helper/description text */
  description?: string;
  /** Number of rows for textarea */
  rows?: number;
  /** Additional className for the container */
  className?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * SimpleFormField - A reusable form field component that wraps Label + Input/Textarea
 * 
 * Use this for forms that don't use react-hook-form context.
 * For react-hook-form based forms, use the shadcn FormField component instead.
 * 
 * @example
 * ```tsx
 * <SimpleFormField
 *   id={`company-${index}`}
 *   label="Company"
 *   value={experience.name || ""}
 *   onChange={(value) => updateItem(index, "name", value)}
 *   required
 * />
 * ```
 */
export function SimpleFormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  description,
  rows = 3,
  className,
  disabled = false,
  error,
}: SimpleFormFieldProps) {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const displayLabel = required ? `${label} *` : label;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {displayLabel}
      </Label>
      
      {type === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={description ? `${id}-description` : undefined}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={description ? `${id}-description` : undefined}
        />
      )}
      
      {description && !error && (
        <p id={`${id}-description`} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

/**
 * SimpleFormFieldList - Variant for fields that handle array values (comma-separated or newline-separated)
 */
export interface SimpleFormFieldListProps extends Omit<SimpleFormFieldProps, "value" | "onChange"> {
  /** Array value */
  value: string[];
  /** Change handler for array */
  onChange: (value: string[]) => void;
  /** Separator type - "comma" or "newline" */
  separator?: "comma" | "newline";
}

export function SimpleFormFieldList({
  value,
  onChange,
  separator = "comma",
  type = "textarea",
  ...props
}: SimpleFormFieldListProps) {
  const displayValue = separator === "comma" 
    ? value.join(", ") 
    : value.join("\n");

  const handleChange = React.useCallback(
    (newValue: string) => {
      const splitValue = separator === "comma"
        ? newValue.split(",").map(v => v.trim()).filter(Boolean)
        : newValue.split("\n").filter(v => v.trim());
      onChange(splitValue);
    },
    [onChange, separator]
  );

  return (
    <SimpleFormField
      {...props}
      type={type}
      value={displayValue}
      onChange={handleChange}
    />
  );
}
