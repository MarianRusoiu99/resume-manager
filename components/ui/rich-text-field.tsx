"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import type { BlockNoteEditorMethods } from "@/modules/editor/components/BlockNoteEditorWrapper.client";

// Dynamically import BlockNote to avoid SSR issues
const BlockNoteEditor = dynamic(
  () => import("@/modules/editor/components/BlockNoteEditorWrapper.client").then((mod) => mod.BlockNoteEditorWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[100px] p-3 flex items-center justify-center text-muted-foreground border rounded-md bg-muted/20">
        Loading editor...
      </div>
    ),
  }
);

export interface RichTextFieldProps {
  /** Field name/id - used for accessibility */
  id: string;
  /** Label text */
  label: string;
  /** Current value (markdown string) */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Helper/description text */
  description?: string;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Additional className for the container */
  className?: string;
  /** Whether the field is disabled/readonly */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * RichTextField - A form field component with BlockNote rich text editing
 * 
 * Supports bold, italic, lists, bullet points, and other rich formatting.
 * Stores content as markdown for compatibility with JSONResume.
 */
export function RichTextField({
  id,
  label,
  value,
  onChange,
  placeholder = "Start typing...",
  required = false,
  description,
  minHeight = 120,
  className,
  disabled = false,
  error,
}: Readonly<RichTextFieldProps>) {
  const editorRef = React.useRef<BlockNoteEditorMethods>(null);
  const displayLabel = required ? `${label} *` : label;
  
  // Track if we need to update the editor from external value changes
  const [isEditorReady, setIsEditorReady] = React.useState(false);
  const lastExternalValue = React.useRef(value);
  
  // Handle changes from the editor
  const handleChange = React.useCallback(
    (newMarkdown: string) => {
      lastExternalValue.current = newMarkdown;
      onChange(newMarkdown);
    },
    [onChange]
  );
  
  // Update editor when external value changes (e.g., from AI enhancement)
  React.useEffect(() => {
    if (isEditorReady && value !== lastExternalValue.current && editorRef.current) {
      lastExternalValue.current = value;
      editorRef.current.setMarkdown(value);
    }
  }, [value, isEditorReady]);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {displayLabel}
      </Label>
      
      <div 
        className={cn(
          "border border-input rounded-md overflow-hidden bg-transparent dark:bg-input/30",
          error && "border-destructive",
          disabled && "opacity-50 pointer-events-none"
        )}
        style={{ minHeight }}
      >
        <BlockNoteEditor
          ref={editorRef}
          markdown={value}
          onChange={handleChange}
          readOnly={disabled}
          placeholder={placeholder}
          className="prose prose-sm max-w-none [&_.bn-container]:min-h-[100px] [&_.bn-editor]:p-3"
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
