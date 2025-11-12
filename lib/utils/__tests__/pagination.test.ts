import { describe, it, expect, vi } from 'vitest';
import {
  A4_DIMENSIONS,
  calculatePageScrollPosition,
  calculateTotalPages,
  validatePageNavigation,
  configureIframeScrolling,
  scrollToPage,
  setupIframePagination,
} from '../pagination';

describe('Pagination Utilities', () => {
  describe('A4_DIMENSIONS', () => {
    it('should have correct A4 dimensions at 96 DPI', () => {
      expect(A4_DIMENSIONS.WIDTH).toBe(794);
      expect(A4_DIMENSIONS.HEIGHT).toBe(1123);
    });
  });

  describe('calculatePageScrollPosition', () => {
    it('should return 0 for page 1', () => {
      const scrollY = calculatePageScrollPosition(1);
      expect(scrollY).toBe(0);
    });

    it('should calculate correct position for page 2', () => {
      const scrollY = calculatePageScrollPosition(2);
      expect(scrollY).toBe(1123);
    });

    it('should calculate correct position for page 3', () => {
      const scrollY = calculatePageScrollPosition(3);
      expect(scrollY).toBe(2246);
    });

    it('should handle custom page height', () => {
      const customHeight = 1000;
      const scrollY = calculatePageScrollPosition(2, customHeight);
      expect(scrollY).toBe(1000);
    });

    it('should handle page numbers less than 1 gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const scrollY = calculatePageScrollPosition(0);
      expect(scrollY).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('calculateTotalPages', () => {
    it('should return 1 for content fitting in single page', () => {
      const pages = calculateTotalPages(800);
      expect(pages).toBe(1);
    });

    it('should return 2 for content spanning just over 1 page', () => {
      const pages = calculateTotalPages(1500);
      expect(pages).toBe(2);
    });

    it('should return correct pages for exact page boundary', () => {
      const pages = calculateTotalPages(A4_DIMENSIONS.HEIGHT * 2);
      expect(pages).toBe(2);
    });

    it('should return 3 for tall content', () => {
      const pages = calculateTotalPages(3000);
      expect(pages).toBe(3);
    });

    it('should return at least 1 page for zero height content', () => {
      const pages = calculateTotalPages(0);
      expect(pages).toBe(1);
    });

    it('should handle custom page height', () => {
      const customHeight = 1000;
      const pages = calculateTotalPages(2500, customHeight);
      expect(pages).toBe(3);
    });

    it('should round up partial pages', () => {
      const pages = calculateTotalPages(1124); // Just 1 pixel over 1 page
      expect(pages).toBe(2);
    });
  });

  describe('validatePageNavigation', () => {
    it('should not allow previous on page 1', () => {
      const { canGoPrevious, canGoNext } = validatePageNavigation(1, 3);
      expect(canGoPrevious).toBe(false);
      expect(canGoNext).toBe(true);
    });

    it('should allow both directions on middle page', () => {
      const { canGoPrevious, canGoNext } = validatePageNavigation(2, 3);
      expect(canGoPrevious).toBe(true);
      expect(canGoNext).toBe(true);
    });

    it('should not allow next on last page', () => {
      const { canGoPrevious, canGoNext } = validatePageNavigation(3, 3);
      expect(canGoPrevious).toBe(true);
      expect(canGoNext).toBe(false);
    });

    it('should handle single-page document', () => {
      const { canGoPrevious, canGoNext } = validatePageNavigation(1, 1);
      expect(canGoPrevious).toBe(false);
      expect(canGoNext).toBe(false);
    });
  });

  describe('configureIframeScrolling', () => {
    it('should handle missing documentElement gracefully', () => {
      const mockDoc = {} as Document;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Should not throw
      expect(() => {
        configureIframeScrolling(mockDoc);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('scrollToPage', () => {
    it('should handle missing documentElement gracefully', () => {
      const mockDoc = {} as Document;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Should not throw
      expect(() => {
        scrollToPage(mockDoc, 1);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('setupIframePagination', () => {
    it('should return false for iframe without document', () => {
      const mockIframe = { contentDocument: null } as HTMLIFrameElement;
      
      const result = setupIframePagination(mockIframe, 1);
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', () => {
      const mockIframe = {
        get contentDocument() {
          throw new Error('Access denied');
        }
      } as unknown as HTMLIFrameElement;
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = setupIframePagination(mockIframe, 1);
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
