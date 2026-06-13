'use client';

import { FileText, Mail, MessageSquare, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationType } from '../hooks/useSessionManager';

interface ChatHeaderTabsProps {
  generationType: GenerationType;
  sessionCount: number;
  onSwitchType: (type: GenerationType) => void;
}

export function ChatHeaderTabs({ generationType, sessionCount, onSwitchType }: ChatHeaderTabsProps) {
  return (
    <div className="shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onSwitchType('resume')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all',
              generationType === 'resume' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Resume
          </button>
          <button
            type="button"
            onClick={() => onSwitchType('cover-letter')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all',
              generationType === 'cover-letter' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Mail className="h-3.5 w-3.5" />
            Cover Letter
          </button>
          <button
            type="button"
            onClick={() => onSwitchType('template')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all',
              generationType === 'template' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Palette className="h-3.5 w-3.5" />
            Template
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {sessionCount} sessions
          </span>
        </div>
      </div>
    </div>
  );
}
