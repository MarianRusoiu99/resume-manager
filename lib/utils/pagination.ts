/**
 * Pagination utilities for iframe-based resume preview
 * Handles page navigation, scrolling, and scrollbar hiding for multi-page content
 */

/**
 * A4 page dimensions at 96 DPI (standard web resolution)
 */
export const A4_DIMENSIONS = {
  WIDTH: 794,  // pixels
  HEIGHT: 1123, // pixels
} as const;

/**
 * Configuration for hiding scrollbars while maintaining scroll functionality
 */
const SCROLLBAR_HIDE_STYLES = `
  html::-webkit-scrollbar { display: none; }
  html { scroll-behavior: smooth; }
  body { margin: 0; padding: 0; }
`;

/**
 * Calculates the scroll position for a given page number
 * @param pageNumber - The page number to navigate to (1-indexed)
 * @param pageHeight - Height of a single page in pixels (default: A4_DIMENSIONS.HEIGHT)
 * @returns The scroll offset in pixels
 */
export function calculatePageScrollPosition(
  pageNumber: number,
  pageHeight: number = A4_DIMENSIONS.HEIGHT
): number {
  if (pageNumber < 1) {
    console.warn('Page number must be >= 1, defaulting to page 1');
    return 0;
  }
  return (pageNumber - 1) * pageHeight;
}

/**
 * Calculates the total number of pages based on content height
 * @param contentHeight - Total height of the content in pixels
 * @param pageHeight - Height of a single page in pixels (default: A4_DIMENSIONS.HEIGHT)
 * @returns The total number of pages (minimum 1)
 */
export function calculateTotalPages(
  contentHeight: number,
  pageHeight: number = A4_DIMENSIONS.HEIGHT
): number {
  const pages = Math.ceil(contentHeight / pageHeight);
  return Math.max(1, pages); // Always show at least 1 page
}

/**
 * Configures an iframe document to support hidden scrolling for pagination
 * This enables scrolling within the iframe while hiding the scrollbars
 * @param iframeDoc - The iframe's document object
 */
export function configureIframeScrolling(iframeDoc: Document): void {
  if (!iframeDoc.documentElement) {
    console.error('Cannot configure scrolling: documentElement not available');
    return;
  }

  // Enable scrolling but hide scrollbars
  iframeDoc.documentElement.style.overflow = 'auto';
  iframeDoc.documentElement.style.scrollbarWidth = 'none'; // Firefox
  
  // @ts-expect-error - msOverflowStyle is a legacy IE/Edge property
  iframeDoc.documentElement.style.msOverflowStyle = 'none'; // IE/Edge

  // Inject CSS for webkit scrollbar hiding
  const styleId = 'pagination-styles';
  if (!iframeDoc.getElementById(styleId)) {
    const styleEl = iframeDoc.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = SCROLLBAR_HIDE_STYLES;
    iframeDoc.head.appendChild(styleEl);
  }
}

/**
 * Scrolls the iframe document to display a specific page
 * @param iframeDoc - The iframe's document object
 * @param pageNumber - The page number to navigate to (1-indexed)
 * @param pageHeight - Height of a single page in pixels (default: A4_DIMENSIONS.HEIGHT)
 */
export function scrollToPage(
  iframeDoc: Document,
  pageNumber: number,
  pageHeight: number = A4_DIMENSIONS.HEIGHT
): void {
  if (!iframeDoc.documentElement) {
    console.error('Cannot scroll: documentElement not available');
    return;
  }

  const scrollY = calculatePageScrollPosition(pageNumber, pageHeight);
  iframeDoc.documentElement.scrollTop = scrollY;
}

/**
 * Sets up pagination for an iframe with multi-page content
 * Configures scrolling and navigates to the specified page
 * @param iframe - The iframe element reference
 * @param currentPage - The page number to display (1-indexed)
 * @returns true if successful, false otherwise
 */
export function setupIframePagination(
  iframe: HTMLIFrameElement,
  currentPage: number
): boolean {
  try {
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      console.error('Cannot access iframe document');
      return false;
    }

    // Configure scrolling behavior
    configureIframeScrolling(iframeDoc);

    // Navigate to the requested page
    scrollToPage(iframeDoc, currentPage);

    return true;
  } catch (error) {
    console.error('Error setting up iframe pagination:', error);
    return false;
  }
}

/**
 * Validates page navigation boundaries
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @returns Object indicating if previous/next navigation is allowed
 */
export function validatePageNavigation(
  currentPage: number,
  totalPages: number
): { canGoPrevious: boolean; canGoNext: boolean } {
  return {
    canGoPrevious: currentPage > 1,
    canGoNext: currentPage < totalPages,
  };
}
