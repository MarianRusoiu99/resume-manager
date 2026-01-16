'use client';

import { cn } from '@/lib/utils';

import { Loader2 } from 'lucide-react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function Spinner({ size = 'md', className, label }: Readonly<SpinnerProps>) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2
        className={cn(
          'animate-spin text-primary',
          sizeClasses[size],
          className
        )}
      />
      {label && <p className="text-xs font-medium text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
}
