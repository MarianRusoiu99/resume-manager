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

        const scaleWidth = containerWidth / A4_WIDTH;
        const scaleHeight = containerHeight / A4_HEIGHT;
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
