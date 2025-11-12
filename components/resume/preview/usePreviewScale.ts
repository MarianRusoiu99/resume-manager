/**
 * Preview Scale Hook
 * Calculates responsive scale for preview
 * Single Responsibility: Scale calculation
 */

'use client';

import { useState, useEffect } from 'react';
import { A4_WIDTH, A4_HEIGHT } from '@/lib/utils/pagination';

interface UsePreviewScaleOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
}

export function usePreviewScale({
  containerRef,
  isFullscreen,
}: UsePreviewScaleOptions) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      if (containerRef?.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale to fit width or height (whichever is more constraining)
        const scaleWidth = containerWidth / A4_WIDTH;
        const scaleHeight = containerHeight / A4_HEIGHT;
        const newScale = Math.min(scaleWidth, scaleHeight, 1); // Don't scale up beyond 100%

        setScale(newScale);
        console.log(
          'Scale calculated:',
          newScale,
          'Container:',
          containerWidth,
          'x',
          containerHeight
        );
      }
    };

    calculateScale();
    globalThis.addEventListener('resize', calculateScale);
    return () => globalThis.removeEventListener('resize', calculateScale);
  }, [isFullscreen, containerRef]);

  return scale;
}
