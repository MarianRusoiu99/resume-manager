/**
 * Custom hook for pagination and fullscreen functionality
 * Single Responsibility: Handle pagination state and navigation + fullscreen modal
 */

import { useState, useEffect } from 'react';

export function usePagination() {
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
    isFullscreen,
    toggleFullscreen,
  };
}
