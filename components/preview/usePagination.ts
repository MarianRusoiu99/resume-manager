/**
 * Custom hook for pagination and fullscreen functionality
 * Single Responsibility: Handle pagination state and navigation + fullscreen modal
 */

import { useState, useEffect, useCallback, RefObject } from 'react';
import { setupIframeContinuousScroll } from '@/lib/utils/pagination';

interface UsePaginationProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  htmlContent: string | null;
}

export function usePagination({ iframeRef, htmlContent }: UsePaginationProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const initPagination = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setupIframeContinuousScroll(iframe);
  }, [iframeRef]);

  // Re-initialize when HTML content changes
  useEffect(() => {
    initPagination();
  }, [htmlContent, initPagination]);

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen]);

  return {
    isFullscreen,
    toggleFullscreen,
    currentPage: 1,
    totalPages: 1,
    handlePageChange: () => {},
    initPagination,
  };
}

