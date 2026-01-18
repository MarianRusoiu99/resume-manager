'use client';

/**
 * AI Enhance Base Modal
 * 
 * Shared modal structure for AI enhancement dialogs.
 * Provides consistent layout and styling.
 */

import { ReactNode } from 'react';

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

import { BaseDialog } from '@/components/core/feedback/dialogs/BaseDialog';

export function AIEnhanceBaseModal(props: Readonly<AIEnhanceBaseModalProps>) {
  return (
    <BaseDialog
      {...props}
      variant="premium"
      size={props.size === 'default' ? 'lg' : props.size === 'large' ? 'xl' : props.size}
    />
  );
}
