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
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SimpleFormFieldProps {
  /** Field name/id - used for accessibility */
  id: string;
  /** Field name for forms */
  name?: string;
  /** Label text */
  label: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Input type - defaults to "text" */
  type?: "text" | "email" | "tel" | "url" | "month" | "date" | "number" | "textarea" | "select" | "password";
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
  name,
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
}: Readonly<SimpleFormFieldProps>) {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const displayLabel = required ? `${label} *` : label;
  const fieldName = name || id;

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <Textarea
          id={id}
          name={fieldName}
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
          <SelectTrigger id={id} name={fieldName} aria-invalid={!!error}>
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

    if (type === "password") {
      return (
        <div className="relative">
          <Input
            id={id}
            name={fieldName}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="pr-10"
            aria-invalid={!!error}
            aria-describedby={description ? `${id}-description` : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {showPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
      );
    }

    if (type === "month" || type === "date") {
      return (
        <Input
          id={id}
          name={fieldName}
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
        name={fieldName}
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
