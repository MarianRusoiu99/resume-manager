/**
 * Pagination Utilities for Resume Preview
 * Provides reusable functions for multi-page document preview with iframe scrolling
 */

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
 * Configure iframe document for hidden scrolling
 * Sets up the document element to be scrollable without showing scrollbars
 * @param iframeDocument - The iframe's document object
 */
export function configureIframeScrolling(iframeDocument: Document): void {
  if (!iframeDocument?.documentElement) {
    throw new Error('Invalid iframe document');
  }

  const { documentElement } = iframeDocument;
  
  // Enable scrolling on the document element
  documentElement.style.overflow = 'auto';
  documentElement.style.height = '100%';
  
  // Hide scrollbars across all browsers
  documentElement.style.scrollbarWidth = 'none'; // Firefox
  documentElement.style.msOverflowStyle = 'none'; // IE/Edge
  
  // Inject CSS to hide WebKit scrollbars
  const style = iframeDocument.createElement('style');
  style.textContent = `
    ::-webkit-scrollbar {
      display: none;
    }
    html {
      scroll-behavior: smooth;
    }
  `;
  iframeDocument.head.appendChild(style);
}

/**
 * Scroll iframe to a specific page with smooth animation
 * @param iframeDocument - The iframe's document object
 * @param pageNumber - The target page number (1-indexed)
 * @param pageHeight - Height of each page in pixels
 */
export function scrollToPage(
  iframeDocument: Document,
  pageNumber: number,
  pageHeight: number = A4_HEIGHT
): void {
  if (!iframeDocument?.documentElement) {
    throw new Error('Invalid iframe document');
  }

  const scrollPosition = calculatePageScrollPosition(pageNumber, pageHeight);
  iframeDocument.documentElement.scrollTop = scrollPosition;
}

/**
 * Complete pagination setup for an iframe
 * Configures scrolling and returns the total number of pages
 * @param iframe - The iframe element
 * @param pageHeight - Height of each page in pixels
 * @returns Total number of pages, or null if iframe is not ready
 */
export function setupIframePagination(
  iframe: HTMLIFrameElement | null,
  pageHeight: number = A4_HEIGHT
): number | null {
  if (!iframe) {
    return null;
  }

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc?.body) {
    return null;
  }

  try {
    // Configure scrolling
    configureIframeScrolling(iframeDoc);

    // Calculate total pages
    const contentHeight = iframeDoc.body.scrollHeight;
    return calculateTotalPages(contentHeight, pageHeight);
  } catch (error) {
    console.error('Error setting up iframe pagination:', error);
    return null;
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
