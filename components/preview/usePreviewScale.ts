/**
 * Custom hook for preview scaling
 * Single Responsibility: Handle preview scale calculations
 */

import { useState, useEffect, RefObject, useCallback } from 'react';
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

  const calculateScale = useCallback(() => {
    if (disabled) {
      return 1;
    }

    if (containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Use all available space with minimal padding (8px)
      const availableWidth = containerWidth - 16;
      const availableHeight = containerHeight - 16;

      const scaleWidth = availableWidth / A4_WIDTH;
      const scaleHeight = availableHeight / A4_HEIGHT;

      // In fullscreen, we must fit both dimensions
      // In editor view, we primarily fit width but enforce a minimum scale
      let newScale = isFullscreen
        ? Math.min(scaleWidth, scaleHeight)
        : scaleWidth;

      // On mobile/smaller screens, don't let it get ridiculously small
      if (!isFullscreen && newScale < 0.6) {
        newScale = 0.6;
      }

      return newScale;
    }

    return 1;
  }, [containerRef, disabled, isFullscreen]);

  useEffect(() => {
    const updateScale = () => {
      setScale(calculateScale());
    };

    updateScale();
    globalThis.addEventListener('resize', updateScale);
    return () => globalThis.removeEventListener('resize', updateScale);
  }, [calculateScale]);

  return { scale };
}
