'use client';

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  centerAction?: ReactNode;
  rightAction?: ReactNode;
  variant?: 'default' | 'premium' | 'sidebar';
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'fullscreen';
  className?: string;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  default: 'max-w-lg',
  lg: 'max-w-4xl h-[80vh]',
  xl: 'max-w-6xl h-[85vh]',
  fullscreen: 'max-w-[98vw] h-[98vh]',
};

export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  centerAction,
  rightAction,
  variant = 'default',
  size = 'default',
  className,
  showCloseButton = true,
}: Readonly<BaseDialogProps>) {
  const isPremium = variant === 'premium';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'p-0 flex flex-col overflow-hidden transition-all duration-300',
          isPremium && 'bg-background/80 backdrop-blur-xl border-muted/50 shadow-premium',
          !isPremium && 'bg-background shadow-lg',
          showCloseButton && '[&>button]:hidden', // Hide default close button if we provide our own
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b flex-shrink-0 relative",
          isPremium ? "border-muted/20 bg-muted/5" : "border-border bg-card/30"
        )}>
          <div className="flex items-center gap-3">
            {isPremium && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm border border-primary/20">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            <div>
              {title && <h2 className="text-sm font-bold tracking-tight">{title}</h2>}
              {isPremium && (
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none mt-0.5">
                  AI Assistant
                </p>
              )}
              {description && !isPremium && (
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>

          {centerAction && (
            <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
              {centerAction}
            </div>
          )}

          <div className="flex items-center gap-2">
            {rightAction && (
              <div className="flex items-center gap-3 mr-2">
                {rightAction}
              </div>
            )}
            {showCloseButton && (
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className={cn(
          "flex-1 overflow-y-auto flex flex-col p-6 min-h-0",
          isPremium ? "bg-background/40" : "bg-background"
        )}>
          {children}
        </div>

        {/* Footer Area */}
        {footer && (
          <div className={cn(
            "px-6 py-4 border-t flex items-center justify-end gap-3 flex-shrink-0",
            isPremium ? "border-muted/20 bg-muted/5" : "border-border bg-card/30"
          )}>
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
