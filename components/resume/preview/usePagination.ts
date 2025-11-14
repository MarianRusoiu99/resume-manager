/**
 * Custom hook for pagination and fullscreen functionality
 * Single Responsibility: Handle pagination state and navigation + fullscreen modal
 */

import { useState, useEffect, RefObject } from 'react';

interface UsePaginationProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  fullscreenIframeRef: RefObject<HTMLIFrameElement | null>;
}

export function usePagination({ iframeRef, fullscreenIframeRef }: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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
    currentPage,
    totalPages,
    isFullscreen,
    setCurrentPage,
    setTotalPages,
    toggleFullscreen,
  };
}
