/**
 * Unified Cover Letter Editor Component
 * 
 * A reusable component for displaying and editing cover letters across the application.
 * Features:
 * - Display mode with markdown rendering
 * - Edit mode with rich text editor
 * - Export to PDF functionality
 * - Copy to clipboard
 * - Consistent UI across all pages
 */

'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button, Card } from '@/components/ui';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import type { BlockNoteEditorMethods } from '@/components/editor/BlockNoteEditorWrapper.client';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { FileDown, Copy, Edit, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverLetterEditorProps {
  /**
   * Cover letter content in markdown format
   */
  content: string;
  
  /**
   * Cover letter content in Yoopta JSON format (for editing with formatting)
   */
  contentJson?: string;
  
  /**
   * Whether the cover letter can be edited
   * @default false
   */
  editable?: boolean;
  
  /**
   * Resume ID for exporting cover letter to PDF (optional)
   */
  resumeId?: string;
  
  /**
   * Callback when cover letter is saved (for editable mode)
   * @param content - Markdown content
   * @param contentJson - Yoopta JSON state
   */
  onSave?: (content: string, contentJson: string) => Promise<void>;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Show card wrapper
   * @default true
   */
  showCard?: boolean;
  
  /**
   * Custom title
   * @default "Generated Cover Letter"
   */
  title?: string;
}

export function CoverLetterEditor({
  content,
  contentJson,
  editable = false,
  onSave,
  className,
  showCard = true,
  title = 'Generated Cover Letter',
}: Readonly<CoverLetterEditorProps>) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const editorRef = useRef<BlockNoteEditorMethods>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Cover letter copied to clipboard!');
  };

  const handleStartEdit = () => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleSaveEdit = async (markdown: string) => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      
      // Get JSON state from editor
      const json = editorRef.current?.getJSON() || '{}';
      
      await onSave(markdown, json);
      setEditedContent(markdown);
      setIsEditing(false);
      toast.success('Cover letter saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save cover letter');
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <RichTextEditor
          ref={editorRef}
          key="editing-mode" // Force remount when entering edit mode
          initialValue={editedContent}
          initialJsonValue={contentJson}
          onSave={handleSaveEdit}
          placeholder="Edit your cover letter..."
          showSaveButton={false}
          readOnly={false}
          onChange={(value) => setEditedContent(value)}
        />
      );
    }

    return (
      <MarkdownPreview 
        content={content}
        className="bg-muted/50 p-6 rounded-lg border"
      />
    );
  };

  const actionButtons = (
    <div className="flex gap-2">
      {editable && !isEditing && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartEdit}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      )}
      
      {isEditing && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelEdit}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => handleSaveEdit(editedContent)}
            disabled={isSaving}
          >
            <Check className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </>
      )}
      
      {!isEditing && (
        
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          
      )}
    </div>
  );

  if (!showCard) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          {actionButtons}
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {actionButtons}
      </div>
      {renderContent()}
    </Card>
  );
}
