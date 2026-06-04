'use client';

import { useState, useEffect } from 'react';
import { BrainCircuit, Save, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface MemoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generationType: 'resume' | 'cover-letter' | 'template';
  /** Current session-scoped memory text */
  memoryContent: string;
  onSave: (mode: string, content: string) => void;
  onDelete: (mode: string) => void;
}

const modeLabel = (mode: 'resume' | 'cover-letter' | 'template') => {
  if (mode === 'cover-letter') return 'Cover Letter';
  if (mode === 'template') return 'Template';
  return 'Resume';
};

const modePlaceholder = (mode: 'resume' | 'cover-letter' | 'template') => {
  if (mode === 'cover-letter') return 'e.g. Always write in a warm, conversational tone. Target senior roles in fintech.';
  if (mode === 'template') return 'e.g. Prefer two-column layouts with a dark left sidebar. Use Inter font.';
  return 'e.g. I have 8 years in backend engineering. Focus on distributed systems experience.';
};

export function MemoryDrawer({
  open,
  onOpenChange,
  generationType,
  memoryContent,
  onSave,
  onDelete,
}: MemoryDrawerProps) {
  const [draft, setDraft] = useState(memoryContent);
  const isDirty = draft !== memoryContent;

  // Sync external content changes (e.g. session switch resets to '')
  useEffect(() => {
    setDraft(memoryContent);
  }, [memoryContent]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[460px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Session Memory
          </SheetTitle>
          <SheetDescription>
            Notes injected into the AI context for this session only. Cleared automatically when
            you start a new session. Use it to set tone, focus, or recurring constraints.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-3 px-6 py-5">
          <Label className="text-sm font-semibold">
            {modeLabel(generationType)} Context
          </Label>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={modePlaceholder(generationType)}
            className="flex-1 min-h-[220px] resize-none text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!isDirty}
              onClick={() => onSave(generationType, draft)}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!memoryContent}
              onClick={() => {
                onDelete(generationType);
                setDraft('');
              }}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
