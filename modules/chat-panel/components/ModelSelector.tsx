'use client';

import { useState } from 'react';
import { ChevronDown, Check, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ModelSelectorProps {
  modelId: string | null;
  onChange: (modelId: string | null) => void;
  generationType: 'resume' | 'cover-letter' | 'template';
}

const KNOWN_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { id: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { id: 'claude-haiku-3-5', label: 'Claude Haiku 3.5' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function ModelSelector({ modelId, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const label = modelId ? truncate(modelId, 20) : 'Default';

  function select(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2">
          <Cpu className="h-3 w-3 shrink-0" />
          <span>Model: {label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-1" align="start">
        <ScrollArea className="max-h-[260px]">
          <div className="flex flex-col">
            <button
              className="flex items-center justify-between px-3 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
              onClick={() => select(null)}
            >
              <span>Use Default</span>
              {modelId === null && <Check className="h-3 w-3 text-primary" />}
            </button>
            <div className="my-1 border-t" />
            {KNOWN_MODELS.map((m) => (
              <button
                key={m.id}
                className="flex items-center justify-between px-3 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                onClick={() => select(m.id)}
              >
                <span>{m.label}</span>
                {modelId === m.id && <Check className="h-3 w-3 text-primary" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
