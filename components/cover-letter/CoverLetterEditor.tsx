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

import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Card } from '@/components/ui';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { FileDown, Copy, Edit, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverLetterEditorProps {
  /**
   * Cover letter content in markdown format
   */
  content: string;
  
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
   */
  onSave?: (content: string) => Promise<void>;
  
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
  editable = false,
  resumeId,
  onSave,
  className,
  showCard = true,
  title = 'Generated Cover Letter',
}: CoverLetterEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  /**
   * Convert markdown to HTML for display
   * Simple markdown parser for basic formatting
   */
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    // Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text* -> <em>text</em>
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Paragraphs: double newlines
    html = html.split('\n\n').map(para => `<p>${para}</p>`).join('');
    
    // Single newlines within paragraphs
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  };

  /**
   * Convert HTML back to markdown for editing
   */
  const htmlToMarkdown = (html: string): string => {
    let markdown = html;
    
    // Strong -> **text**
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');
    
    // Em -> *text*
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
    markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');
    
    // Paragraphs
    markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
    
    // Line breaks
    markdown = markdown.replace(/<br\s*\/?>/g, '\n');
    
    // Clean up extra whitespace
    markdown = markdown.trim();
    
    return markdown;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Cover letter copied to clipboard!');
  };

  const handleExportPDF = async () => {
    if (!resumeId) {
      toast.error('Cannot export: No resume ID provided');
      return;
    }

    try {
      setIsExporting(true);
      
      const response = await fetch(`/api/resumes/${resumeId}/export-cover-letter`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export cover letter');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Cover letter exported to PDF!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export cover letter');
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartEdit = () => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleSaveEdit = async (html: string) => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      const markdown = htmlToMarkdown(html);
      await onSave(markdown);
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
          initialValue={markdownToHtml(editedContent)}
          onSave={handleSaveEdit}
          placeholder="Edit your cover letter..."
          showSaveButton={false}
          onChange={() => {}} // No-op, we handle save explicitly
        />
      );
    }

    return (
      <div 
        className="prose max-w-none bg-muted/50 p-6 rounded-lg border whitespace-pre-wrap leading-relaxed"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
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
            onClick={() => {
              const editorEl = document.querySelector('[contenteditable="true"]');
              if (editorEl) {
                handleSaveEdit((editorEl as HTMLElement).innerHTML);
              }
            }}
            disabled={isSaving}
          >
            <Check className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </>
      )}
      
      {!isEditing && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          
          {resumeId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          )}
        </>
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
