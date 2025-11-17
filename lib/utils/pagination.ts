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
    console.error('configureIframeScrolling: Invalid iframe document');
    throw new Error('Invalid iframe document');
  }

  const { documentElement, body } = iframeDocument;
  
  console.log('📄 Configuring iframe for page-based rendering...');
  
  // Reset default styles
  documentElement.style.overflow = 'hidden';
  documentElement.style.height = '100vh';
  documentElement.style.margin = '0';
  documentElement.style.padding = '0';
  
  if (body) {
    body.style.overflow = 'hidden';
    body.style.height = '100vh';
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.position = 'relative';
  }
  
  // Check if page container already exists to avoid double-wrapping
  let pageContainer = iframeDocument.getElementById('page-container');
  
  if (pageContainer) {
    console.log('📄 Page container already exists, reusing...');
  } else {
    // Create page container wrapper only if it doesn't exist
    pageContainer = iframeDocument.createElement('div');
    pageContainer.id = 'page-container';
    pageContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      min-height: ${A4_HEIGHT}px;
      padding: 0;
      box-sizing: border-box;
      overflow: visible;
      transition: transform 0.3s ease-in-out;
      transform: translateY(0px);
      background: white;
    `;
    
    // Move all body content into the page container
    if (body) {
      // Store original content
      const originalContent = Array.from(body.children);
      
      // Clear body
      body.innerHTML = '';
      
      // Add page container
      body.appendChild(pageContainer);
      
      // Move original content to page container
      for (const child of originalContent) {
        pageContainer.appendChild(child);
      }
    }
  }
  
  // Inject CSS for page-based layout
  const style = iframeDocument.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: inherit;
      line-height: 1.6;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    
    #page-container {
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      position: relative;
    }
    
    /* Add page break indicators */
    #page-container::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(0,0,0,0.1) 20%, 
        rgba(0,0,0,0.1) 80%, 
        transparent 100%
      );
    }
    
    /* Ensure content flows naturally with proper spacing */
    #page-container > * {
      max-width: 100%;
      word-wrap: break-word;
    }
    
    /* Handle headings and paragraphs */
    #page-container h1, 
    #page-container h2, 
    #page-container h3 {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }
    
    #page-container p {
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }
    
    /* Hide scrollbars */
    ::-webkit-scrollbar {
      display: none;
    }
    
    html, body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
  `;
  iframeDocument.head?.appendChild(style);
  
  console.log('📄 Iframe configured for page-based rendering');
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
    console.error('scrollToPage: Invalid iframe document');
    throw new Error('Invalid iframe document');
  }

  console.log(`📄 Moving to page ${pageNumber}`);
  
  
  
  // Calculate the translation needed to show the desired page
  // No padding offset needed - content handles its own margins via @page CSS
  const translateY = -(pageNumber - 1) * pageHeight;
  
  console.log(`📄 Translating page container by ${translateY}px (page ${pageNumber}, page height: ${pageHeight}px)`);
  
  // Use CSS transform to "scroll" to the page

  
  // Add page break visualization
  addPageBreakVisualization(iframeDocument, pageNumber);
}

/**
 * Add visual page break indicators
 */
function addPageBreakVisualization(
  iframeDocument: Document,
  currentPage: number
): void {
  // Remove existing page break indicators
  const existingIndicators = iframeDocument.querySelectorAll('.page-break-indicator');
  for (const indicator of existingIndicators) {
    indicator.remove();
  }
  
  // Add page break line at the bottom of current visible area
  if (currentPage > 1) {
    const pageBreak = iframeDocument.createElement('div');
    pageBreak.className = 'page-break-indicator';
    pageBreak.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(74, 144, 226, 0.6) 10%, 
        rgba(74, 144, 226, 0.8) 50%, 
        rgba(74, 144, 226, 0.6) 90%, 
        transparent 100%
      );
      z-index: 1000;
      pointer-events: none;
      animation: fadeIn 0.3s ease-in-out;
    `;
    
    // Add fade-in animation
    const style = iframeDocument.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scaleX(0); }
        to { opacity: 1; transform: scaleX(1); }
      }
    `;
    if (!iframeDocument.querySelector('style[data-page-breaks]')) {
      style.dataset.pageBreaks = 'true';
      iframeDocument.head?.appendChild(style);
    }
    
    iframeDocument.body?.appendChild(pageBreak);
    
    // Remove the indicator after animation
    setTimeout(() => {
      pageBreak.remove();
    }, 1000);
  }
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
    // Configure page-based rendering
    configureIframeScrolling(iframeDoc);
    
    // Wait for the DOM to settle and measure accurately
    // Force a reflow to ensure accurate measurements
    const _forceReflow = iframeDoc.body.offsetHeight;
    console.log('📄 Forced reflow, body height:', _forceReflow);
    
    // Calculate total pages based on page container content
    const pageContainer = iframeDoc.getElementById('page-container');
    if (!pageContainer) {
      console.error('Page container not found after configuration');
      return null;
    }
    
    // Use scrollHeight for the most accurate content measurement
    const contentHeight = pageContainer.scrollHeight;
    
    // No padding offset needed - content handles its own margins via @page CSS
    // Calculate pages based on A4 page height
    const totalPages = Math.max(1, Math.ceil(contentHeight / pageHeight));
    
    console.log(`📄 Setup pagination:`, {
      contentHeight,
      pageHeight,
      totalPages,
      containerScrollHeight: pageContainer.scrollHeight,
      containerOffsetHeight: pageContainer.offsetHeight,
    });
    
    return totalPages;
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
