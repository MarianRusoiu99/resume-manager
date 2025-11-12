/**
 * Tests for Pagination Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  A4_HEIGHT,
  A4_WIDTH,
  calculatePageScrollPosition,
  calculateTotalPages,
  configureIframeScrolling,
  scrollToPage,
  setupIframePagination,
  validatePageNavigation,
} from '../pagination';

describe('Pagination Constants', () => {
  it('should have correct A4 dimensions at 96 DPI', () => {
    expect(A4_HEIGHT).toBe(1123); // 297mm at 96 DPI
    expect(A4_WIDTH).toBe(794);   // 210mm at 96 DPI
  });
});

describe('calculatePageScrollPosition', () => {
  it('should return 0 for page 1', () => {
    expect(calculatePageScrollPosition(1)).toBe(0);
  });

  it('should calculate correct position for page 2', () => {
    expect(calculatePageScrollPosition(2)).toBe(A4_HEIGHT);
  });

  it('should calculate correct position for page 3', () => {
    expect(calculatePageScrollPosition(3)).toBe(A4_HEIGHT * 2);
  });

  it('should handle custom page height', () => {
    expect(calculatePageScrollPosition(2, 1000)).toBe(1000);
  });

  it('should throw error for page number less than 1', () => {
    expect(() => calculatePageScrollPosition(0)).toThrow('Page number must be at least 1');
    expect(() => calculatePageScrollPosition(-1)).toThrow('Page number must be at least 1');
  });
});

describe('calculateTotalPages', () => {
  it('should return 1 for content less than one page', () => {
    expect(calculateTotalPages(500)).toBe(1);
    expect(calculateTotalPages(A4_HEIGHT - 1)).toBe(1);
  });

  it('should return 1 for exactly one page', () => {
    expect(calculateTotalPages(A4_HEIGHT)).toBe(1);
  });

  it('should return 2 for content slightly over one page', () => {
    expect(calculateTotalPages(A4_HEIGHT + 1)).toBe(2);
  });

  it('should calculate multiple pages correctly', () => {
    expect(calculateTotalPages(A4_HEIGHT * 2)).toBe(2);
    expect(calculateTotalPages(A4_HEIGHT * 2.5)).toBe(3);
    expect(calculateTotalPages(A4_HEIGHT * 3)).toBe(3);
  });

  it('should handle custom page height', () => {
    expect(calculateTotalPages(2500, 1000)).toBe(3);
  });

  it('should return 1 for zero or negative content height', () => {
    expect(calculateTotalPages(0)).toBe(1);
    expect(calculateTotalPages(-100)).toBe(1);
  });
});

describe('configureIframeScrolling', () => {
  let mockDocument: Document;
  let mockHead: HTMLHeadElement;
  let mockDocumentElement: HTMLElement;

  beforeEach(() => {
    mockHead = {
      appendChild: (child: Node) => child,
    } as unknown as HTMLHeadElement;

    mockDocumentElement = {
      style: {
        overflow: '',
        height: '',
        scrollbarWidth: '',
        msOverflowStyle: '',
      },
    } as unknown as HTMLElement;

    mockDocument = {
      documentElement: mockDocumentElement,
      head: mockHead,
      createElement: (tagName: string) => {
        if (tagName === 'style') {
          return { textContent: '' } as HTMLStyleElement;
        }
        return {} as HTMLElement;
      },
    } as unknown as Document;
  });

  it('should configure scrolling on document element', () => {
    configureIframeScrolling(mockDocument);

    expect(mockDocumentElement.style.overflow).toBe('auto');
    expect(mockDocumentElement.style.height).toBe('100%');
    expect(mockDocumentElement.style.scrollbarWidth).toBe('none');
    expect(mockDocumentElement.style.msOverflowStyle).toBe('none');
  });

  it('should throw error for invalid document', () => {
    expect(() => configureIframeScrolling(null as unknown as Document)).toThrow('Invalid iframe document');
    expect(() => configureIframeScrolling({} as Document)).toThrow('Invalid iframe document');
  });

  it('should inject style element to hide scrollbars', () => {
    let injectedStyle: HTMLStyleElement | null = null;
    mockHead.appendChild = ((child: Node) => {
      if ('textContent' in child) {
        injectedStyle = child as HTMLStyleElement;
      }
      return child;
    }) as unknown as typeof mockHead.appendChild;

    configureIframeScrolling(mockDocument);

    expect(injectedStyle).not.toBeNull();
    expect(injectedStyle?.textContent).toContain('::-webkit-scrollbar');
    expect(injectedStyle?.textContent).toContain('scroll-behavior: smooth');
  });
});

describe('scrollToPage', () => {
  let mockDocument: Document;
  let mockDocumentElement: HTMLElement;

  beforeEach(() => {
    mockDocumentElement = {
      scrollTop: 0,
    } as unknown as HTMLElement;

    mockDocument = {
      documentElement: mockDocumentElement,
    } as unknown as Document;
  });

  it('should scroll to page 1 (position 0)', () => {
    scrollToPage(mockDocument, 1);
    expect(mockDocumentElement.scrollTop).toBe(0);
  });

  it('should scroll to page 2', () => {
    scrollToPage(mockDocument, 2);
    expect(mockDocumentElement.scrollTop).toBe(A4_HEIGHT);
  });

  it('should scroll to page 3', () => {
    scrollToPage(mockDocument, 3);
    expect(mockDocumentElement.scrollTop).toBe(A4_HEIGHT * 2);
  });

  it('should handle custom page height', () => {
    scrollToPage(mockDocument, 2, 1000);
    expect(mockDocumentElement.scrollTop).toBe(1000);
  });

  it('should throw error for invalid document', () => {
    expect(() => scrollToPage(null as unknown as Document, 1)).toThrow('Invalid iframe document');
    expect(() => scrollToPage({} as Document, 1)).toThrow('Invalid iframe document');
  });
});

describe('setupIframePagination', () => {
  it('should return null for null iframe', () => {
    expect(setupIframePagination(null)).toBeNull();
  });

  it('should return null for iframe without content document', () => {
    const mockIframe = {} as HTMLIFrameElement;
    expect(setupIframePagination(mockIframe)).toBeNull();
  });

  it('should configure scrolling and return total pages', () => {
    const mockBody = {
      scrollHeight: A4_HEIGHT * 2.5, // 2.5 pages = 3 total pages
    };

    const mockHead = {
      appendChild: () => {},
    };

    const mockDocumentElement = {
      style: {
        overflow: '',
        height: '',
        scrollbarWidth: '',
        msOverflowStyle: '',
      },
    };

    const mockDocument = {
      body: mockBody,
      head: mockHead,
      documentElement: mockDocumentElement,
      createElement: () => ({ textContent: '' }),
    } as unknown as Document;

    const mockIframe = {
      contentDocument: mockDocument,
    } as HTMLIFrameElement;

    const totalPages = setupIframePagination(mockIframe);

    expect(totalPages).toBe(3);
    expect(mockDocumentElement.style.overflow).toBe('auto');
  });

  it('should handle errors gracefully', () => {
    const mockDocument = {
      body: { scrollHeight: 2000 },
      documentElement: null, // This will cause an error
    } as unknown as Document;

    const mockIframe = {
      contentDocument: mockDocument,
    } as HTMLIFrameElement;

    const totalPages = setupIframePagination(mockIframe);

    expect(totalPages).toBeNull();
  });
});

describe('validatePageNavigation', () => {
  it('should return true for valid page numbers', () => {
    expect(validatePageNavigation(1, 3)).toBe(true);
    expect(validatePageNavigation(2, 3)).toBe(true);
    expect(validatePageNavigation(3, 3)).toBe(true);
  });

  it('should return false for page number less than 1', () => {
    expect(validatePageNavigation(0, 3)).toBe(false);
    expect(validatePageNavigation(-1, 3)).toBe(false);
  });

  it('should return false for page number greater than total pages', () => {
    expect(validatePageNavigation(4, 3)).toBe(false);
    expect(validatePageNavigation(10, 3)).toBe(false);
  });

  it('should handle edge case of single page', () => {
    expect(validatePageNavigation(1, 1)).toBe(true);
    expect(validatePageNavigation(0, 1)).toBe(false);
    expect(validatePageNavigation(2, 1)).toBe(false);
  });
});
