/**
 * Custom hook for preview scaling
 * Single Responsibility: Handle preview scale calculations
 */

import { useState, useEffect, RefObject } from 'react';
import { A4_WIDTH, A4_HEIGHT } from '@/lib/utils/pagination';

interface UsePreviewScaleProps {
  containerRef: RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
  disabled?: boolean;
}

export function usePreviewScale({
  containerRef,
  isFullscreen,
  disabled = false,
}: UsePreviewScaleProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (disabled) {
      setScale(1);
      return;
    }

    const calculateScale = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Use all available space with minimal padding (8px)
        const availableWidth = containerWidth - 16;
        const availableHeight = containerHeight - 16;

        const scaleWidth = availableWidth / A4_WIDTH;
        // In the Template Editor, we prioritize width fitting to maximize space, 
        // since the preview is vertically scrollable anyway.
        const newScale = isFullscreen ? Math.min(scaleWidth, availableHeight / A4_HEIGHT) : scaleWidth;

        setScale(newScale);
      }
    };

    calculateScale();
    globalThis.addEventListener('resize', calculateScale);
    return () => globalThis.removeEventListener('resize', calculateScale);
  }, [isFullscreen, containerRef, disabled]);

  return { scale };
}
