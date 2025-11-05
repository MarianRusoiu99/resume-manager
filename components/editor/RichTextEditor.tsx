/**
 * Rich Text Editor Component
 * A markdown editor using Yoopta Editor for cover letter editing
 */

'use client';

import { useCallback, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import type { YooptaEditorMethods } from './YooptaEditorWrapper.client';

// Import the wrapper component props type
type YooptaEditorWrapperProps = {
  markdown: string;
  jsonContent?: string; // Yoopta JSON state for editing
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
};

// Dynamically import Yoopta Editor to avoid SSR issues
const YooptaEditorComponent = dynamic<YooptaEditorWrapperProps & { ref?: React.Ref<YooptaEditorMethods> }>(
  () => import('./YooptaEditorWrapper.client').then((mod) => mod.YooptaEditorWrapper),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] p-4 flex items-center justify-center text-foreground">
        Loading editor...
      </div>
    ),
  }
);

interface RichTextEditorProps {
  initialValue?: string;
  initialJsonValue?: string; // Yoopta JSON state for editing with formatting
  onChange?: (markdown: string) => void;
  onSave?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  showSaveButton?: boolean;
}

export const RichTextEditor = forwardRef<YooptaEditorMethods, RichTextEditorProps>(
  function RichTextEditor({
    initialValue = '',
    initialJsonValue,
    onChange,
    onSave,
    placeholder = 'Start typing...',
    className,
    readOnly = false,
    showSaveButton = true,
  }, ref) {
    const editorRef = useRef<YooptaEditorMethods>(null);
    const [currentMarkdown, setCurrentMarkdown] = useState(initialValue);
    const [hasChanges, setHasChanges] = useState(false);

    // Expose editor methods to parent via ref
    useImperativeHandle(ref, () => ({
      getMarkdown: () => editorRef.current?.getMarkdown() || '',
      setMarkdown: (markdown: string) => editorRef.current?.setMarkdown(markdown),
      getValue: () => editorRef.current?.getValue() || {},
      setValue: (value) => editorRef.current?.setValue(value),
      getJSON: () => editorRef.current?.getJSON() || '{}',
      setJSON: (jsonString: string) => editorRef.current?.setJSON(jsonString),
    }), []);

  // Handle content changes from the editor
  const handleChange = useCallback((value: string) => {
    setCurrentMarkdown(value);
    setHasChanges(true);
    onChange?.(value);
  }, [onChange]);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(currentMarkdown);
      setHasChanges(false);
    }
  }, [currentMarkdown, onSave]);

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {showSaveButton && onSave && (
        <div className="flex items-center justify-end gap-2 p-2 border-b bg-muted/30">
          <Button
            type="button"
            variant={hasChanges ? 'default' : 'ghost'}
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            title="Save (Ctrl+S)"
            className="h-8"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      )}

      <div className={cn(
        'prose prose-sm max-w-none',
        readOnly && 'bg-muted/20'
      )}>
        <YooptaEditorComponent
          ref={editorRef}
          markdown={initialValue}
          jsonContent={initialJsonValue}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className="min-h-[200px] p-4"
        />
      </div>
    </div>
  );
});
