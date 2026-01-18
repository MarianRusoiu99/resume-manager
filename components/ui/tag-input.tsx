"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TagInputProps {
  /** Field id - used for accessibility */
  id: string;
  /** Label text */
  label: string;
  /** Current tags */
  value: string[];
  /** Change handler */
  onChange: (value: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Helper/description text */
  description?: string;
  /** Additional className for the container */
  className?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * TagInput - A form field for entering tags/keywords
 * 
 * Features:
 * - Type and press Enter or comma to add a tag
 * - Click X or press Backspace on empty input to remove last tag
 * - Visual tag chips with remove button
 */
export function TagInput({
  id,
  label,
  value = [],
  onChange,
  placeholder = "Type and press Enter to add...",
  required = false,
  description,
  className,
  disabled = false,
  error,
}: Readonly<TagInputProps>) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const displayLabel = required ? `${label} *` : label;

  const addTag = React.useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  }, [value, onChange]);

  const removeTag = React.useCallback((indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  }, [value, onChange]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag when pressing backspace on empty input
      removeTag(value.length - 1);
    }
  }, [inputValue, value.length, addTag, removeTag]);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // If user pastes or types a comma, split and add tags
    if (newValue.includes(",")) {
      const parts = newValue.split(",");
      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          // Add all complete parts (before commas)
          const trimmed = part.trim();
          if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
          }
        } else {
          // Keep the last part in the input
          setInputValue(part);
        }
      });
    } else {
      setInputValue(newValue);
    }
  }, [value, onChange]);

  const handleBlur = React.useCallback(() => {
    // Add current input as tag when blurring (if not empty)
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  }, [inputValue, addTag]);

  const handleContainerClick = React.useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {displayLabel}
      </Label>

      <div
        onClick={handleContainerClick}
        className={cn(
          "flex flex-wrap gap-1.5 p-2 min-h-[42px] rounded-md border border-input bg-transparent dark:bg-input/30 cursor-text",
          "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring",
          error && "border-destructive",
          disabled && "opacity-50 pointer-events-none cursor-not-allowed"
        )}
      >
        {value.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className="gap-1 pr-1 text-sm font-normal"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground",
            disabled && "cursor-not-allowed"
          )}
          aria-describedby={description ? `${id}-description` : undefined}
        />
      </div>

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
