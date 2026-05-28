'use client';

import { useState } from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ReasoningBlockProps {
  thinking: string;
  isStreaming?: boolean;
}

export function ReasoningBlock({ thinking, isStreaming = false }: ReasoningBlockProps) {
  const [open, setOpen] = useState(false);

  if (!thinking) return null;

  return (
    <div className="max-w-[85%] w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5">
            <Brain className="size-3" />
            <span>{isStreaming ? 'Thinking...' : 'View reasoning'}</span>
            <ChevronDown
              className={cn(
                'size-3 transition-transform',
                open && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-2.5 text-xs text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
            {thinking}
            {isStreaming && (
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground/50 ml-0.5 align-middle" />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
