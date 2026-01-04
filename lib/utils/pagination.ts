/**
 * Pagination Utilities for Resume Preview
 * Provides reusable functions for multi-page document preview with iframe scrolling
 */

import { clientLogger } from '@/lib/utils/client-logger';

const log = clientLogger.forComponent('pagination');

/** A4 page height in pixels at 96 DPI (297mm) */
export const A4_HEIGHT = 1123;

/** A4 page width in pixels at 96 DPI (210mm) */
export const A4_WIDTH = 794;

/**
 * Calculate the scroll position for a given page number
 * @param pageNumber - The target page number (1-indexed)
 * @param pageHeight - Height of each page in pixels
 * @returns The scroll position in pixels
 */
export function calculatePageScrollPosition(
  pageNumber: number,
  pageHeight: number = A4_HEIGHT
): number {
  if (pageNumber < 1) {
    throw new Error('Page number must be at least 1');
  }
  return (pageNumber - 1) * pageHeight;
}

/**
 * Calculate total number of pages from content height
 * @param contentHeight - Total height of the content in pixels
 * @param pageHeight - Height of each page in pixels
 * @returns Total number of pages (at least 1)
 */
export function calculateTotalPages(
  contentHeight: number,
  pageHeight: number = A4_HEIGHT
): number {
  if (contentHeight <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(contentHeight / pageHeight));
}

/**
 * Configure iframe document for continuous scrolling
 * Sets up the document element to be naturally scrollable
 * @param iframeDocument - The iframe's document object
 */
export function configureIframeScrolling(iframeDocument: Document): void {
  if (!iframeDocument?.documentElement) {
    log.error('configureIframeScrolling: Invalid iframe document');
    throw new Error('Invalid iframe document');
  }

  const { documentElement, body } = iframeDocument;

  // Reset default styles for continuous scroll
  documentElement.style.overflow = 'auto';
  documentElement.style.height = 'auto';
  documentElement.style.margin = '0';
  documentElement.style.padding = '0';

  if (body) {
    body.style.overflow = 'visible';
    body.style.height = 'auto';
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.position = 'relative';
    body.style.background = 'white';
  }

  // Inject CSS for natural layout
  const style = iframeDocument.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: inherit;
      line-height: 1.6;
      background: white;
      margin: 0;
      padding: 0;
    }
    
    /* Ensure content flows naturally */
    body > * {
      max-width: 100%;
      word-wrap: break-word;
    }
    
    /* Handle headings and paragraphs */
    h1, h2, h3 {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }
    
    p {
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }
    
    /* Custom scrollbar for the preview */
    ::-webkit-scrollbar {
      width: 4px;
    }
    
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    
    ::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.2);
    }
    
    html {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
    }

    /* Print styles to preserve page breaks for PDF export */
    @media print {
      body {
        background: white;
      }
      .page-break {
        page-break-before: always;
      }
    }
  `;
  iframeDocument.head?.appendChild(style);
}

/**
 * Complete setup for an iframe in continuous scroll mode
 * @param iframe - The iframe element
 * @returns true if successful, false otherwise
 */
export function setupIframeContinuousScroll(
  iframe: HTMLIFrameElement | null
): boolean {
  if (!iframe) {
    return false;
  }

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc?.body) {
    return false;
  }

  try {
    configureIframeScrolling(iframeDoc);
    return true;
  } catch (error) {
    log.error('Error setting up iframe continuous scroll', error);
    return false;
  }
}


/**
 * Validate page navigation boundaries
 * @param pageNumber - The target page number
 * @param totalPages - Total number of pages available
 * @returns True if the page number is valid
 */
export function validatePageNavigation(
  pageNumber: number,
  totalPages: number
): boolean {
  return pageNumber >= 1 && pageNumber <= totalPages;
}
