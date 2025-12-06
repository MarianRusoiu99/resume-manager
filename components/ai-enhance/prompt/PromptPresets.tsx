'use client';

/**
 * Prompt Presets Component
 * 
 * Quick instruction preset buttons for common enhancement tasks.
 * Built with shadcn/ui Badge components.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InstructionPreset } from '../types';

interface PromptPresetsProps {
  presets: InstructionPreset[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PromptPresets({
  presets,
  onSelect,
  disabled = false,
  className,
}: Readonly<PromptPresetsProps>) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {presets.map((preset) => (
        <Badge
          key={preset.label}
          variant="outline"
          className={cn(
            'cursor-pointer px-3 py-1.5 text-xs font-medium',
            'hover:bg-primary hover:text-primary-foreground',
            'transition-colors duration-200',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
          onClick={() => !disabled && onSelect(preset.value)}
        >
          {preset.label}
        </Badge>
      ))}
    </div>
  );
}
