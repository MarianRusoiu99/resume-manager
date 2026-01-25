/**
 * Rich Text Editor Component
 * A markdown editor using TipTap Editor for cover letter editing
 */

'use client';

import { useCallback, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import type { TiptapEditorMethods } from './TiptapEditorWrapper.client';
import { useComponentLogger } from "@/hooks";

interface RichTextEditorProps {
  initialContent?: string;
  jsonContent?: string;
  onChange?: (html: string) => void;
  onJSONChange?: (json: string) => void;
  onSave?: (markdown: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  showSaveButton?: boolean;
}

const TiptapEditorComponent = dynamic(
  () => import('./TiptapEditorWrapper.client').then(mod => mod.TiptapEditorWrapper),
  { 
    ssr: false,
    loading: () => <div className="h-32 w-full animate-pulse bg-muted rounded-md" />
  }
);

export const RichTextEditor = forwardRef<TiptapEditorMethods, RichTextEditorProps>(
  ({ 
    initialContent = '', 
    jsonContent, 
    onChange, 
    onJSONChange, 
    onSave,
    className, 
    placeholder, 
    readOnly,
    showSaveButton = false
  }, ref) => {
    const log = useComponentLogger('RichTextEditor');
    const editorRef = useRef<TiptapEditorMethods>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [currentContent, setCurrentContent] = useState(initialContent);

    useImperativeHandle(ref, () => editorRef.current!);

    const handleChange = useCallback((html: string) => {
      setCurrentContent(html);
      setHasChanges(true);
      onChange?.(html);
    }, [onChange]);

    const handleSave = useCallback(() => {
      if (onSave) {
        onSave(currentContent);
        setHasChanges(false);
      }
    }, [currentContent, onSave]);

    return (
      <div className={cn("relative w-full border rounded-md p-1 min-h-[150px] focus-within:ring-1 focus-within:ring-ring", className)}>
        {showSaveButton && onSave && (
          <div className="flex items-center justify-end gap-2 p-2 border-b bg-muted/30">
            <Button
              type="button"
              variant={hasChanges ? 'default' : 'ghost'}
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className="h-8"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        )}
        <TiptapEditorComponent
          ref={editorRef}
          markdown={initialContent}
          jsonContent={jsonContent}
          onChange={handleChange}
          onJSONChange={onJSONChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className="prose prose-sm dark:prose-invert max-w-none min-h-[140px] px-3 py-2 outline-none"
        />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
