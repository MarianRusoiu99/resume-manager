'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ShareStateProps {
  publicSlug?: string;
  onTogglePublic?: () => Promise<void>;
}

export function useShareState({ publicSlug, onTogglePublic }: ShareStateProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleTogglePublic = useCallback(async () => {
    if (onTogglePublic) {
      await onTogglePublic();
    }
  }, [onTogglePublic]);

  const handleCopyPublicLink = useCallback(() => {
    if (!publicSlug) return;
    const link = `${globalThis.location.origin}/public/${publicSlug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  }, [publicSlug]);

  return {
    showShareDialog,
    setShowShareDialog,
    handleTogglePublic,
    handleCopyPublicLink,
    publicLink: publicSlug ? `${globalThis.location.origin}/public/${publicSlug}` : null,
  };
}
