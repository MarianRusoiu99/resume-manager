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

import { useState, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import type { TiptapEditorMethods } from '@/modules/editor/components/TiptapEditorWrapper.client';
import { useComponentLogger } from "@/hooks";
import { MarkdownPreview } from "@/modules/editor/components/MarkdownPreview";
import { CoverLetterEditorToolbar } from "./editor/CoverLetterEditorToolbar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import heavy editor and AI modal components
const RichTextEditor = dynamic(
  () => import('@/modules/editor/components/RichTextEditor').then(mod => mod.RichTextEditor),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />
  }
);

const AIEnhanceTextModal = dynamic(
  () => import('@/modules/ai-enhance/modals/AIEnhanceTextModal').then(mod => mod.AIEnhanceTextModal),
  { ssr: false }
);

interface CoverLetterEditorProps {
  content: string;
  contentJson?: string;
  onSave?: (markdown: string, json: string) => Promise<void>;
  className?: string;
  editable?: boolean;
}

export interface CoverLetterEditorMethods {
  save: () => Promise<void>;
  setIsEditing: (isEditing: boolean) => void;
  isEditing: boolean;
  copyToClipboard: () => Promise<void>;
  enhance: () => void;
}

export type CoverLetterEditorRef = CoverLetterEditorMethods;

export const CoverLetterEditor = forwardRef<CoverLetterEditorMethods, CoverLetterEditorProps>(
  ({ content, contentJson = '{}', onSave, className }, ref) => {
  const log = useComponentLogger('CoverLetterEditor');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  
  const editorRef = useRef<TiptapEditorMethods>(null);

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
          initialContent={editedContent}
          jsonContent={contentJson}
          placeholder="Edit your cover letter..."
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
