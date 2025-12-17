'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CalloutVariant = 'info' | 'neutral' | 'warning' | 'danger';

type CalloutTone = 'default' | 'soft';

interface CalloutProps {
  children: ReactNode;
  className?: string;
  variant?: CalloutVariant;
  tone?: CalloutTone;
}

const variantClasses: Record<CalloutVariant, Record<CalloutTone, string>> = {
  info: {
    default: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100',
    soft: 'bg-blue-50/60 border-blue-200/60 text-blue-900 dark:bg-blue-950/60 dark:border-blue-800/60 dark:text-blue-100',
  },
  warning: {
    default: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
    soft: 'bg-yellow-50/60 border-yellow-200/60 text-yellow-800 dark:bg-yellow-950/60 dark:border-yellow-800/60 dark:text-yellow-200',
  },
  danger: {
    default: 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
    soft: 'bg-red-50/60 border-red-200/60 text-red-600 dark:bg-red-950/60 dark:border-red-800/60 dark:text-red-200',
  },
  neutral: {
    default: 'bg-muted border-border text-foreground',
    soft: 'bg-muted/60 border-border/60 text-foreground',
  },
};

export function Callout({
  children,
  className,
  variant = 'info',
  tone = 'default',
}: CalloutProps) {
  return (
    <div
      className={cn(
        'rounded-md border p-4 text-sm',
        variantClasses[variant][tone],
        className
      )}
    >
      {children}
    </div>
  );
}
