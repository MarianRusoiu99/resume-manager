'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ConversationMessage } from '@/modules/ai-enhance/hooks/useConversation';
import { ReasoningBlock } from './ReasoningBlock';

interface ChatMessageProps {
  message: ConversationMessage;
  isStreaming?: boolean;
}

function formatTimestamp(date: Date): string {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderOutputPreview(output: unknown): string {
  if (!output || typeof output !== 'object') {
    return typeof output === 'string' ? output : JSON.stringify(output, null, 2);
  }

  const data = output as Record<string, unknown>;

  if (typeof data.content === 'string') {
    // cover letter style output
    return data.content;
  }

  if (data.resume && typeof data.resume === 'object') {
    const resume = data.resume as Record<string, unknown>;
    const basics = resume.basics as Record<string, unknown> | undefined;
    const name = typeof basics?.name === 'string' ? basics.name : 'Generated Resume';
    const label = typeof basics?.label === 'string' ? basics.label : '';
    return `${name}${label ? ` — ${label}` : ''}\n\nResume generated successfully. Expand raw output for full JSON.`;
  }

  if (typeof data.htmlTemplate === 'string') {
    return data.htmlTemplate.slice(0, 1200);
  }

  return JSON.stringify(output, null, 2);
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [outputOpen, setOutputOpen] = useState(false);

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-1',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        {isStreaming && !message.content ? (
          <div className="flex items-center gap-1 py-1">
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>

      {message.thinking && (
        <ReasoningBlock thinking={message.thinking} isStreaming={isStreaming && !message.output} />
      )}

      {message.output != null && (
        <div className="max-w-[85%] w-full rounded-lg border border-border bg-card p-2">
          <p className="text-xs whitespace-pre-wrap break-words text-foreground/90">{renderOutputPreview(message.output)}</p>

          <Collapsible open={outputOpen} onOpenChange={setOutputOpen}>
            <CollapsibleTrigger asChild>
              <button className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown
                  className={cn(
                    'size-3 transition-transform',
                    outputOpen && 'rotate-180'
                  )}
                />
                View Raw Result
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1">
              <pre className="overflow-auto rounded-lg bg-muted/50 border border-border p-2 text-xs text-foreground">
                {typeof message.output === 'string'
                  ? message.output
                  : JSON.stringify(message.output, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      <span className="px-1 text-[10px] text-muted-foreground/60">
        {formatTimestamp(message.timestamp)}
      </span>
    </div>
  );
}
