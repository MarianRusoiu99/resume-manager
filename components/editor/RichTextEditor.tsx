/**
 * Rich Text Editor Component
 * A simple, accessible rich text editor for cover letter editing
 * Uses contentEditable with basic formatting controls (bold, italic, lists)
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  initialValue?: string;
  onChange?: (html: string) => void;
  onSave?: (html: string) => void;
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
  const editorRef = useRef<HTMLDivElement>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && initialValue) {
      editorRef.current.innerHTML = initialValue;
    }
  }, [initialValue]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setHasChanges(true);
      onChange?.(content);
    }
  }, [onChange]);

  // Execute formatting commands
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // Handle save
  const handleSave = useCallback(() => {
    if (editorRef.current && onSave) {
      const content = editorRef.current.innerHTML;
      onSave(content);
      setHasChanges(false);
    }
  }, [onSave]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      execCommand('bold');
    }
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      execCommand('italic');
    }
  }, [execCommand, handleSave]);

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            title="Bold (Ctrl+B)"
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            title="Italic (Ctrl+I)"
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertUnorderedList')}
            title="Bullet List"
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertOrderedList')}
            title="Numbered List"
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('undo')}
            title="Undo"
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('redo')}
            title="Redo"
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>

          {showSaveButton && onSave && (
            <>
              <div className="flex-1" />
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
            </>
          )}
        </div>
      )}

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none',
          'prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
          readOnly && 'bg-muted/20 cursor-default',
          !readOnly && 'bg-background'
        )}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        style={{
          // Show placeholder when empty
          ...(placeholder && {
            position: 'relative',
          }),
        }}
      />
      
      <style jsx>{`
        [contenteditable='true']:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
      `}</style>
    </div>
  );
}
