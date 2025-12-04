"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/lib/contexts";
import { toast } from "sonner";
import { ClipboardPaste, Upload } from "lucide-react";
import { resumeSchema } from "@/lib/validations/jsonresume";

/**
 * ImportFromJSON Component
 * 
 * Allows users to import resume data from JSON in their clipboard
 * or paste it directly. Validates the JSON structure before importing.
 */
export function ImportFromJSON() {
  const { updateResume } = useEditor();
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Import resume from clipboard
   */
  const handleImportFromClipboard = async () => {
    try {
      setIsImporting(true);

      // Read text from clipboard
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText.trim()) {
        toast.error("Clipboard is empty");
        return;
      }

      // Parse JSON
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(clipboardText);
      } catch {
        toast.error("Invalid JSON in clipboard. Please copy valid JSON Resume format.");
        return;
      }

      // Validate using Zod schema
      const validation = resumeSchema.safeParse(parsedData);
      
      if (!validation.success) {
        console.error("Validation errors:", validation.error.issues);
        
        // Show more specific error message
        const firstError = validation.error.issues[0];
        const errorMessage = firstError 
          ? `Invalid field: ${firstError.path.join('.')} - ${firstError.message}`
          : "JSON doesn't match Resume schema.";
        
        toast.error(errorMessage);
        return;
      }

      // Import the resume
      updateResume(validation.data);
      toast.success("Resume imported successfully from clipboard!");
      
    } catch (error) {
      console.error("Error importing from clipboard:", error);
      
      // Handle clipboard permission errors
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.error("Clipboard access denied. Please allow clipboard permissions or paste manually.");
      } else {
        toast.error("Failed to import from clipboard");
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleImportFromClipboard}
          disabled={isImporting}
          className="flex items-center gap-2"
        >
          {isImporting ? (
            <>
              <Upload className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <ClipboardPaste className="h-4 w-4" />
              Import from Clipboard
            </>
          )}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          <strong>How to use:</strong>
        </p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Copy your resume JSON to clipboard (must be in <a href="https://jsonresume.org/schema/" target="_blank" rel="noopener noreferrer" className="text-primary underline">JSON Resume format</a>)</li>
          <li>Click &quot;Import from Clipboard&quot; button</li>
          <li>Your profile will be populated with the imported data</li>
        </ol>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          ⚠️ Warning: This will replace your current profile data. Make sure to save any existing changes first.
        </p>
      </div>
    </div>
  );
}
