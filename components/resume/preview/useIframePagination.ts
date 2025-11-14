/**
 * Custom hook for iframe pagination setup
 * Single Responsibility: Handle iframe pagination calculations and scrolling
 */

import { useEffect, RefObject } from 'react';
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
  // Calculate pages when iframe loads
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframe = iframeRef.current;
      
      const handleLoad = () => {
        setTimeout(() => {
          try {
            const totalPagesCalculated = setupIframePagination(iframe, A4_HEIGHT);
            if (totalPagesCalculated !== null) {
              setTotalPages(totalPagesCalculated);
              setCurrentPage(1);
            }
          } catch (error) {
            console.error('Error calculating pages:', error);
          }
        }, 100);
      };

      iframe.addEventListener('load', handleLoad);
      handleLoad();
      
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [htmlContent, setTotalPages, setCurrentPage, iframeRef]);

  // Scroll to current page in main iframe
  useEffect(() => {
    if (iframeRef.current && currentPage > 0 && htmlContent) {
      try {
        const iframe = iframeRef.current;
        
        const timer = setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              scrollToPage(iframeDoc, currentPage, A4_HEIGHT);
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
  }, [currentPage, htmlContent, iframeRef]);

  // Scroll to current page in fullscreen iframe
  useEffect(() => {
    if (fullscreenIframeRef.current && currentPage > 0 && htmlContent) {
      try {
        const iframe = fullscreenIframeRef.current;
        
        const timer = setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              scrollToPage(iframeDoc, currentPage, A4_HEIGHT);
            }
          } catch (err) {
            console.error('Error accessing fullscreen iframe document:', err);
          }
        }, 200);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error scrolling fullscreen iframe to page:', error);
      }
    }
  }, [currentPage, htmlContent, fullscreenIframeRef]);
}