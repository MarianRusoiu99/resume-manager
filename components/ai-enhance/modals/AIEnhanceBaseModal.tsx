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
  DialogClose,
} from '@/components/ui/dialog';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AIEnhanceBaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  centerAction?: ReactNode;
  rightAction?: ReactNode;
  size?: 'default' | 'large' | 'fullscreen';
  className?: string;
}

const sizeClasses = {
  default: 'max-w-4xl h-[80vh]',
  large: 'max-w-6xl h-[85vh]',
  fullscreen: 'max-w-[98vw] h-[98vh]',
};

export function AIEnhanceBaseModal({
  open,
  onOpenChange,
  title = 'Enhance with AI',
  description = 'Use AI to improve your content.',
  children,
  footer,
  centerAction,
  rightAction,
  size = 'large',
  className,
}: Readonly<AIEnhanceBaseModalProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'p-0 flex flex-col overflow-hidden bg-background/80 backdrop-blur-xl border-muted/50 shadow-2xl transition-all duration-300',
          '[&>button]:hidden', // Hide the default absolute close button
          sizeClasses[size],
          className
        )}
      >
        {/* Unified Premium Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-muted/20 bg-muted/5 flex-shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">{title}</h2>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none mt-0.5">
                AI Assistant
              </p>
            </div>
          </div>

          {centerAction && (
            <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
              {centerAction}
            </div>
          )}

          <div className="flex flex-col items-end gap-2">
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
            {rightAction && (
              <div className="flex items-center gap-3">
                {rightAction}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 min-h-0 bg-background/40">
          {children}
        </div>

        {/* Footer Area */}
        {footer && (
          <div className="px-6 py-4 border-t border-muted/20 bg-muted/5 flex items-center justify-end gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
