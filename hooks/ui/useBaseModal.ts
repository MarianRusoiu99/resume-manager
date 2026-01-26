'use client';

import { useState, useCallback } from 'react';

interface UseBaseModalProps {
  initialOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

/**
 * Generic hook for managing modal state (open/close, loading states)
 * Centralizes common modal logic used across AI enhancement, template imports, etc.
 */
export function useBaseModal({ initialOpen = false, onClose, onOpen }: UseBaseModalProps = {}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isPending, setIsPending] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsPending(false);
    onClose?.();
  }, [onClose]);

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsPending(false);
      onClose?.();
    } else {
      onOpen?.();
    }
  }, [onClose, onOpen]);

  return {
    isOpen,
    setIsOpen,
    isPending,
    setIsPending,
    open,
    close,
    onOpenChange,
  };
}
