/**
 * Custom hook for preview scaling
 * Single Responsibility: Handle preview scale calculations
 */

import { useState, useEffect, RefObject } from 'react';
import { A4_WIDTH, A4_HEIGHT } from '@/lib/utils/pagination';

interface UsePreviewScaleProps {
  containerRef: RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
}

export function usePreviewScale({
  containerRef,
  isFullscreen,
}: UsePreviewScaleProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale to fit both width and height (contain)
        // Subtract padding/margins if necessary (e.g., 32px for padding)
        const availableWidth = containerWidth - 32;
        const availableHeight = containerHeight - 32;

        const scaleWidth = availableWidth / A4_WIDTH;
        const scaleHeight = availableHeight / A4_HEIGHT;

        // Use the smaller scale to ensure it fits entirely
        const newScale = Math.min(scaleWidth, scaleHeight, 1);

        setScale(newScale);
      }
    };

    calculateScale();
    globalThis.addEventListener('resize', calculateScale);
    return () => globalThis.removeEventListener('resize', calculateScale);
  }, [isFullscreen, containerRef]);

  return { scale };
}
