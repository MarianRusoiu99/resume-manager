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

import { BaseDialog } from '@/components/shared/dialogs/BaseDialog';

export function AIEnhanceBaseModal(props: Readonly<AIEnhanceBaseModalProps>) {
  return (
    <BaseDialog
      {...props}
      variant="premium"
      size={props.size === 'default' ? 'lg' : props.size === 'large' ? 'xl' : props.size}
    />
  );
}
