"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

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
  type?: "text" | "email" | "tel" | "url" | "month" | "date" | "number" | "textarea" | "select";
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
  /** Options for select type */
  options?: SelectOption[];
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
  options = [],
}: SimpleFormFieldProps) {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const displayLabel = required ? `${label} *` : label;

  const renderInput = () => {
    if (type === "textarea") {
      return (
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
      );
    }

    if (type === "select") {
      return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={id} aria-invalid={!!error}>
            <SelectValue placeholder={placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === "month" || type === "date") {
      return (
        <Input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder || (type === "month" ? "YYYY-MM" : "YYYY-MM-DD")}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={description ? `${id}-description` : undefined}
        />
      );
    }

    return (
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
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {displayLabel}
      </Label>
      
      {renderInput()}
      
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
