'use client';

import { Button } from '@/components/ui';
import { X, Check } from 'lucide-react';

interface CoverLetterEditorToolbarProps {
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function CoverLetterEditorToolbar({
  isSaving,
  onCancel,
  onSave,
}: CoverLetterEditorToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/20">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Editing Mode
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
          className="h-8 rounded-none border-px"
        >
          <X className="w-3.5 h-3.5 mr-2" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="h-8 rounded-none border-px"
        >
          <Check className="w-3.5 h-3.5 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
