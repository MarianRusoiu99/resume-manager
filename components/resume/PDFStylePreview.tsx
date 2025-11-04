'use client';

/**
 * PDF-Style Resume Preview Component
 * Renders resume in a PDF-like paginated view with A4 dimensions
 * Shows multiple pages with navigation arrows and proper page breaks
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface PDFStylePreviewProps {
  resumeId: string;
  previewKey?: number;
  className?: string;
}

export function PDFStylePreview({ resumeId, previewKey = 0, className = '' }: PDFStylePreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch HTML content
  useEffect(() => {
    let mounted = true;

    async function fetchPreview() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/resumes/${resumeId}/preview?v=${previewKey}`);
        
        if (!response.ok) {
          throw new Error('Failed to load preview');
        }

        const html = await response.text();
        
        if (mounted) {
          setHtmlContent(html);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load preview');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPreview();

    return () => {
      mounted = false;
    };
  }, [resumeId, previewKey]);

  // Render content with proper page breaks
  const renderPagedContent = useCallback(() => {
    if (!iframeRef.current || !htmlContent) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) return;

    // Inject content directly without modifications
    // The HTML from the API already has proper A4 styling from renderCompleteDocument
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Calculate page count after content renders
    const calculatePages = () => {
      if (!iframeDoc.body) return;

      const contentHeight = iframeDoc.body.scrollHeight;
      const pageHeightPx = 1123; // A4 height at 96 DPI
      const numPages = Math.max(1, Math.ceil(contentHeight / pageHeightPx));
      
      setTotalPages(numPages);
    };

    // Wait for content and images to load
    setTimeout(calculatePages, 500);
    
    // Also recalculate on iframe load event
    iframe.addEventListener('load', () => setTimeout(calculatePages, 100));
  }, [htmlContent]);

  // Render content when HTML changes
  useEffect(() => {
    renderPagedContent();
  }, [renderPagedContent]);

  // Scroll to specific page
  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) return;

    const pageHeightPx = 1123; // A4 height at 96 DPI
    const scrollTop = (currentPage - 1) * pageHeightPx;
    
    // Scroll the iframe content
    if (iframeDoc.documentElement) {
      iframeDoc.documentElement.scrollTop = scrollTop;
    }
    if (iframeDoc.body) {
      iframeDoc.body.scrollTop = scrollTop;
    }

    // Also scroll the iframe itself if needed
    iframe.scrollTop = scrollTop;
  }, [currentPage]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ minHeight: '600px' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ minHeight: '600px' }}>
        <div className="text-center text-destructive">
          <p className="font-semibold mb-2">Failed to load preview</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-preview-container ${className}`}>
      {/* PDF-like viewer with shadow and border */}
      <div className="relative bg-gray-100 rounded-lg p-4 sm:p-6">
        {/* A4 Page Container with shadow - clips to show only current page */}
        <div 
          ref={containerRef}
          className="mx-auto bg-white shadow-2xl rounded-sm relative"
          style={{
            width: '100%',
            maxWidth: '794px', // A4 width at 96 DPI (210mm)
            height: '1123px', // A4 height at 96 DPI (297mm)
            overflow: 'hidden', // Hide content outside current page
          }}
        >
          <iframe
            ref={iframeRef}
            className="w-full border-0"
            title={`Resume Preview - Page ${currentPage}`}
            sandbox="allow-same-origin"
            style={{
              width: '794px',
              height: `${totalPages * 1123}px`, // Full content height
              transform: `translateY(-${(currentPage - 1) * 1123}px)`, // Shift to show current page
              transition: 'transform 0.3s ease-in-out', // Smooth page transitions
            }}
          />
        </div>

        {/* Page Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="disabled:opacity-50 text-foreground bg-b"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-md border text-sm font-medium">
              <span>Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value, 10);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                className="w-12 text-center border rounded px-1 py-0.5"
              />
              <span>of {totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Page indicator for single page */}
        {totalPages === 1 && (
          <div className="flex items-center justify-center mt-4">
            <div className="px-4 py-2 bg-white rounded-md border text-sm font-medium">
              1 page
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
