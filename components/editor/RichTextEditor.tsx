/**
 * Rich Text Editor Component
 * A markdown editor using MDXEditor for cover letter editing
 */

'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Import the wrapper component props type
type MDXEditorWrapperProps = {
  markdown: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
};

// Dynamically import MDXEditor to avoid SSR issues
const MDXEditorComponent = dynamic<MDXEditorWrapperProps>(
  () => import('./MDXEditorWrapper.client').then((mod) => mod.MDXEditorWrapper),
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
  onChange?: (markdown: string) => void;
  onSave?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  showSaveButton?: boolean;
}

export function RichTextEditor({
  initialValue = '',
  onChange,
  onSave,
  placeholder = 'Start typing...',
  className,
  readOnly = false,
  showSaveButton = true,
}: RichTextEditorProps) {
  const [markdown, setMarkdown] = useState(initialValue);
  const [hasChanges, setHasChanges] = useState(false);

  // Handle content changes
  const handleChange = useCallback((value: string) => {
    setMarkdown(value);
    setHasChanges(true);
    onChange?.(value);
  }, [onChange]);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(markdown);
      setHasChanges(false);
    }
  }, [markdown, onSave]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  return (
    <div className={cn('border rounded-md overflow-hidden', className)} onKeyDown={handleKeyDown}>
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
        <MDXEditorComponent
          markdown={markdown}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className="min-h-[200px] p-4"
        />
      </div>
    </div>
  );
}
