/**
 * Custom hook for iframe pagination setup
 * Single Responsibility: Handle iframe pagination calculations and scrolling
 */

import { useEffect, RefObject, useRef } from 'react';
import { A4_HEIGHT, setupIframePagination, scrollToPage } from '@/lib/utils/pagination';

interface UseIframePaginationProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  fullscreenIframeRef: RefObject<HTMLIFrameElement | null>;
  htmlContent: string | null;
  currentPage: number;
  setTotalPages: (pages: number) => void;
  setCurrentPage: (page: number) => void;
}

export function useIframePagination({
  iframeRef,
  fullscreenIframeRef,
  htmlContent,
  currentPage,
  setTotalPages,
  setCurrentPage,
}: UseIframePaginationProps) {
  // Track if we've calculated pages to prevent resets
  const hasCalculatedPages = useRef(false);
  const lastHtmlContent = useRef<string | null>(null);

  // Calculate pages when iframe loads (only when content changes)
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframe = iframeRef.current;
      
      // Check if content actually changed
      const contentChanged = lastHtmlContent.current !== htmlContent;
      if (contentChanged) {
        console.log('📄 Content changed, recalculating pages...');
        lastHtmlContent.current = htmlContent;
        hasCalculatedPages.current = false;
      }
      
      const handleLoad = () => {
        // Only calculate once per content change
        if (hasCalculatedPages.current && !contentChanged) {
          console.log('📄 Pages already calculated, skipping...');
          return;
        }
        
        // Use a longer timeout to ensure content is fully rendered
        setTimeout(() => {
          try {
            const totalPagesCalculated = setupIframePagination(iframe, A4_HEIGHT);
            console.log('📄 Main iframe - Calculated pages:', totalPagesCalculated);
            if (totalPagesCalculated !== null && totalPagesCalculated > 0) {
              setTotalPages(totalPagesCalculated);
              hasCalculatedPages.current = true;
              // Only reset to page 1 on content change
              if (contentChanged) {
                setCurrentPage(1);
              }
            }
          } catch (error) {
            console.error('Error calculating pages:', error);
          }
        }, 400); // Increased timeout for better reliability
      };

      iframe.addEventListener('load', handleLoad);
      
      // Also trigger immediately if iframe is already loaded
      if (iframe.contentDocument?.readyState === 'complete') {
        handleLoad();
      }
      
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [htmlContent, setTotalPages, setCurrentPage, iframeRef]);

  // Setup fullscreen iframe pagination when it opens
  useEffect(() => {
    if (fullscreenIframeRef.current && htmlContent) {
      const iframe = fullscreenIframeRef.current;
      
      const handleLoad = () => {
        setTimeout(() => {
          try {
            // Setup pagination for fullscreen iframe
            const totalPagesCalculated = setupIframePagination(iframe, A4_HEIGHT);
            console.log('📄 Fullscreen iframe - Calculated pages:', totalPagesCalculated);
            
            // Ensure it matches the main iframe's page count
            if (totalPagesCalculated !== null && totalPagesCalculated > 0) {
              // Don't override if main iframe already has pages calculated
              if (!hasCalculatedPages.current) {
                setTotalPages(totalPagesCalculated);
              }
            }
            
            // Scroll to current page immediately
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc?.body && currentPage > 0) {
              scrollToPage(iframeDoc, currentPage, A4_HEIGHT);
            }
          } catch (error) {
            console.error('Error setting up fullscreen pagination:', error);
          }
        }, 400);
      };

      iframe.addEventListener('load', handleLoad);
      
      if (iframe.contentDocument?.readyState === 'complete') {
        handleLoad();
      }
      
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [fullscreenIframeRef, htmlContent, currentPage, setTotalPages]);

  // Scroll to current page in main iframe
  useEffect(() => {
    if (iframeRef.current && currentPage > 0 && htmlContent) {
      const iframe = iframeRef.current;
      
      const performScroll = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc?.body) {
            console.log('🔄 Scrolling to page:', currentPage);
            scrollToPage(iframeDoc, currentPage, A4_HEIGHT);
          } else {
            console.warn('Iframe document not ready for scrolling');
          }
        } catch (err) {
          console.error('Error accessing iframe document:', err);
        }
      };

      // If iframe is already loaded, scroll immediately
      if (iframe.contentDocument?.readyState === 'complete') {
        setTimeout(performScroll, 100);
      } else {
        // Otherwise wait for load
        const handleLoad = () => {
          setTimeout(performScroll, 200);
        };
        iframe.addEventListener('load', handleLoad);
        return () => iframe.removeEventListener('load', handleLoad);
      }
    }
  }, [currentPage, htmlContent, iframeRef]);

  // Scroll to current page in fullscreen iframe
  useEffect(() => {
    if (fullscreenIframeRef.current && currentPage > 0 && htmlContent) {
      const iframe = fullscreenIframeRef.current;
      
      const performScroll = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc?.body) {
            console.log('🔄 Scrolling fullscreen to page:', currentPage);
            scrollToPage(iframeDoc, currentPage, A4_HEIGHT);
          }
        } catch (err) {
          console.error('Error accessing fullscreen iframe document:', err);
        }
      };

      // Similar logic for fullscreen iframe
      if (iframe.contentDocument?.readyState === 'complete') {
        setTimeout(performScroll, 100);
      } else {
        const handleLoad = () => {
          setTimeout(performScroll, 200);
        };
        iframe.addEventListener('load', handleLoad);
        return () => iframe.removeEventListener('load', handleLoad);
      }
    }
  }, [currentPage, htmlContent, fullscreenIframeRef]);
}