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

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { toast } from 'sonner';
import { RichTextEditor } from '@/modules/editor/components/RichTextEditor';
import type { BlockNoteEditorMethods } from '@/modules/editor/components/BlockNoteEditorWrapper.client';
import { MarkdownPreview } from '@/modules/editor/components/MarkdownPreview';
import { cn } from '@/lib/utils';
import { createComponentLogger } from '@/lib/utils/client-logger';
import { AIEnhanceTextModal } from '@/modules/ai-enhance/modals/AIEnhanceTextModal';
import { CoverLetterEditorToolbar } from './editor/CoverLetterEditorToolbar';


export interface CoverLetterEditorRef {
  save: () => Promise<void>;
  setIsEditing: (isEditing: boolean) => void;
  isEditing: boolean;
  copyToClipboard: () => Promise<void>;
  enhance: () => void;
}

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
   * Custom title
   * @default "Generated Cover Letter"
   */
  title?: string;
}

export const CoverLetterEditor = forwardRef<CoverLetterEditorRef, CoverLetterEditorProps>(({
  content,
  contentJson,
  onSave,
  className,
}, ref) => {
  const log = createComponentLogger('CoverLetterEditor');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  const editorRef = useRef<BlockNoteEditorMethods>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Cover letter copied to clipboard!');
    } catch (error) {
      log.error('Failed to copy to clipboard', error);
      toast.error('Failed to copy to clipboard');
    }
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
      log.error('Save failed', error);
      toast.error('Failed to save cover letter');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    save: () => handleSaveEdit(editedContent),
    setIsEditing,
    isEditing,
    copyToClipboard: handleCopy,
    enhance: () => setEnhanceModalOpen(true),
  }));

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
        className="bg-transparent p-8 rounded-none border-none"
      />
    );
  };

  const handleEnhanceAccept = async (enhancedContent: string) => {
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(enhancedContent, '{}');
        setEditedContent(enhancedContent);
        toast.success('Cover letter enhanced successfully!');
      } catch (error) {
        log.error('Failed to save enhanced content', error);
        toast.error('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      <div className={cn('bg-transparent', className)}>
        {isEditing && (
          <CoverLetterEditorToolbar
            isSaving={isSaving}
            onCancel={() => setIsEditing(false)}
            onSave={() => handleSaveEdit(editedContent)}
          />
        )}
        <div className="p-0">
          {renderContent()}
        </div>
      </div>
      <AIEnhanceTextModal
        open={enhanceModalOpen}
        onOpenChange={setEnhanceModalOpen}
        originalContent={content}
        onAccept={handleEnhanceAccept}
        contentType="markdown"
        title="Enhance Cover Letter"
        description="Use AI to improve your cover letter's tone, clarity, or professionalism."
      />
    </>
  );
});

CoverLetterEditor.displayName = 'CoverLetterEditor';
