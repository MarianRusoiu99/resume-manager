/**
 * Custom hook for pagination and fullscreen functionality
 * Single Responsibility: Handle pagination state and navigation + fullscreen modal
 */

import { useState, useEffect, useCallback, RefObject } from 'react';
import { setupIframePagination, scrollToPage } from '@/lib/utils/pagination';

interface UsePaginationProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  htmlContent: string | null;
}

export function usePagination({ iframeRef, htmlContent }: UsePaginationProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const iframe = iframeRef.current;
    if (iframe) {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        scrollToPage(doc, page);
      }
    }
  }, [iframeRef]);

  const initPagination = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const pages = setupIframePagination(iframe);
    if (pages) {
      setTotalPages(pages);
      // Reset to first page when content changes drastically
      setCurrentPage(1);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        scrollToPage(doc, 1);
      }
    }
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
    currentPage,
    totalPages,
    handlePageChange,
    initPagination,
  };
}
