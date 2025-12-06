'use client';

/**
 * AI Enhance Base Modal
 * 
 * Shared modal structure for AI enhancement dialogs.
 * Provides consistent layout and styling.
 */

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIEnhanceBaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'default' | 'large' | 'fullscreen';
  className?: string;
}

const sizeClasses = {
  default: 'max-w-4xl',
  large: 'max-w-6xl',
  fullscreen: 'max-w-[95vw] h-[95vh]',
};

export function AIEnhanceBaseModal({
  open,
  onOpenChange,
  title = 'Enhance with AI',
  description = 'Use AI to improve, rephrase, or modify your content.',
  children,
  footer,
  size = 'large',
  className,
}: Readonly<AIEnhanceBaseModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[90vh] flex flex-col',
          sizeClasses[size],
          className
        )}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {children}
        </div>

        {footer && (
          <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
