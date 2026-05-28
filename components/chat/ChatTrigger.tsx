'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatTriggerProps {
  onClick: () => void;
  label?: string;
}

export function ChatTrigger({ onClick, label = 'Open AI Assistant' }: ChatTriggerProps) {
  return (
    <div className="fixed right-6 bottom-6 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            size="icon-lg"
            className="rounded-full shadow-lg"
            aria-label={label}
          >
            <Sparkles className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
