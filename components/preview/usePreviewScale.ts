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

      // Always fit both dimensions to ensure the preview is fully visible without zoom
      let newScale = Math.min(scaleWidth, scaleHeight);

      // Sanity bounds
      if (newScale < 0.1) newScale = 0.1; // Allow very small scales for small containers
      // if (newScale > 1.2) newScale = 1.0; // Don't upscale past 100%

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
