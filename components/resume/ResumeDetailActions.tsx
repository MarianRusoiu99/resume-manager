'use client';

import { Button } from '@/components/ui';
import { Copy, Trash2, Save, Share2 } from 'lucide-react';
import type { ResumeEditorRef } from "@/components/editor/ResumeEditor";

interface ResumeDetailActionsProps {
  editorRef: React.RefObject<ResumeEditorRef | null>;
  onDelete: () => void;
  onDuplicate: () => void;
  isDeleting: boolean;
  isDuplicating: boolean;
}

export function ResumeDetailActions({
  editorRef,
  onDelete,
  onDuplicate,
  isDeleting,
  isDuplicating,
}: ResumeDetailActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 font-bold uppercase tracking-widest text-xs hidden sm:flex"
        onClick={() => editorRef.current?.setShowShareDialog(true)}
      >
        <Share2 className="h-3 w-3 mr-2" />
        Share
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 font-bold uppercase tracking-widest text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-3 w-3 mr-2" />
        Delete
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 font-bold uppercase tracking-widest text-xs"
        onClick={onDuplicate}
        disabled={isDuplicating}
      >
        <Copy className="h-3 w-3 mr-2" />
        Duplicate
      </Button>
      <div className="w-px h-4 bg-muted-foreground/20 mx-1" />
      <Button
        size="sm"
        className="h-8 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
        onClick={() => editorRef.current?.save()}
      >
        <Save className="h-3 w-3 mr-2" />
        Save
      </Button>
    </div>
  );
}
