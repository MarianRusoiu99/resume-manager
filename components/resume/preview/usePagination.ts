/**
 * Pagination Management Hook
 * Manages iframe pagination and scrolling
 * Single Responsibility: Pagination state and navigation
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  A4_HEIGHT,
  setupIframePagination,
  scrollToPage,
} from '@/lib/utils/pagination';

interface UsePaginationOptions {
  htmlContent: string | null;
}

export function usePagination({ htmlContent }: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Calculate pages when iframe loads
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframe = iframeRef.current;

      const handleLoad = () => {
        setTimeout(() => {
          try {
            const totalPagesCalculated = setupIframePagination(
              iframe,
              A4_HEIGHT
            );
            if (totalPagesCalculated !== null) {
              console.log('Calculated pages:', totalPagesCalculated);
              setTotalPages(totalPagesCalculated);
              setCurrentPage(1);

              // Ensure we're at the top of the document
              const iframeDoc =
                iframe.contentDocument || iframe.contentWindow?.document;
              if (iframeDoc?.documentElement) {
                iframeDoc.documentElement.scrollTop = 0;
              }
            }
          } catch (error) {
            console.error('Error calculating pages:', error);
          }
        }, 150);
      };

      iframe.addEventListener('load', handleLoad);
      handleLoad();

      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [htmlContent]);

  // Scroll to current page
  useEffect(() => {
    if (iframeRef.current && currentPage > 0 && htmlContent) {
      try {
        const iframe = iframeRef.current;

        const timer = setTimeout(() => {
          try {
            const iframeDoc =
              iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              scrollToPage(iframeDoc, currentPage, A4_HEIGHT);
              console.log('Scrolled to page:', currentPage);
            }
          } catch (err) {
            console.error('Error accessing iframe document:', err);
          }
        }, 200);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error scrolling to page:', error);
      }
    }
  }, [currentPage, htmlContent]);

  return {
    currentPage,
    totalPages,
    iframeRef,
    setCurrentPage,
  };
}
