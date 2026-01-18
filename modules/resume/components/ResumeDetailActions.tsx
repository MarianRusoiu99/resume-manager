'use client';

import { Button } from '@/components/ui';
import { Copy, Trash2, Save, Share2 } from 'lucide-react';
import type { ResumeEditorRef } from "@/modules/editor/components/ResumeEditor";

interface ResumeDetailActionsProps {
  editorRef: React.RefObject<ResumeEditorRef | null>;
  onDelete: () => void;
  onDuplicate: () => void;
  isDeleting: boolean;
  isDuplicating: boolean;
}

// This component is currently unused as its logic has been merged into the ResumeDetailPage
// to support the unified premium layout. Keeping it as a reference for now.
export function ResumeDetailActions({
  editorRef,
  onDelete,
  onDuplicate,
  isDeleting,
  isDuplicating,
}: ResumeDetailActionsProps) {
  return null;
}
