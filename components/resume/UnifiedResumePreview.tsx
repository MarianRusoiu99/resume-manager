/**
 * Unified Resume Preview Component
 * Provides consistent preview experience across all pages with template selection
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { PreviewTemplateSelector } from '@/components/templates/PreviewTemplateSelector';
import { useTemplatePreview } from '@/lib/hooks/useTemplatePreview';
import { renderTemplateClientSide } from '@/lib/utils/client-renderer';
import type { Resume } from '@/lib/validations/jsonresume';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { RefreshCw, Download, Maximize2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  A4_HEIGHT,
  A4_WIDTH,
  setupIframePagination,
  scrollToPage,
} from '@/lib/utils/pagination';

interface UnifiedResumePreviewProps {
  /** Resume data to preview */
  resumeData: Resume;
  /** Optional resume ID for fetching data */
  resumeId?: string;
  /** Optional callback when template changes */
  onTemplateChange?: (templateId: string | null) => void;
  /** Show template selector */
  showTemplateSelector?: boolean;
  /** Show card wrapper */
  showCard?: boolean;
  /** Preview key for forcing refresh */
  previewKey?: number;
  /** Custom class name */
  className?: string;
  /** Custom template HTML (for live editing in TemplateEditor) */
  templateHtml?: string;
  /** Custom template CSS (for live editing in TemplateEditor) */
  templateCss?: string;
}

export function ResumePreview({
  resumeData,
  resumeId,
  onTemplateChange,
  showTemplateSelector = true,
  showCard = true,
  previewKey = 0,
  className = '',
  templateHtml,
  templateCss,
}: Readonly<UnifiedResumePreviewProps>) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [resume, setResume] = useState<Resume>(resumeData);
  const [localPreviewKey, setLocalPreviewKey] = useState(previewKey);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scale to fit container
  useEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale to fit width or height (whichever is more constraining)
        const scaleWidth = containerWidth / A4_WIDTH;
        const scaleHeight = containerHeight / A4_HEIGHT;
        const newScale = Math.min(scaleWidth, scaleHeight, 1); // Don't scale up beyond 100%

        setScale(newScale);
        console.log('Scale calculated:', newScale, 'Container:', containerWidth, 'x', containerHeight);
      }
    };

    calculateScale();
    // Recalculate on window resize
    globalThis.addEventListener('resize', calculateScale);
    return () => globalThis.removeEventListener('resize', calculateScale);
  }, [isFullscreen]);

  // Load template preference from localStorage on mount
  useEffect(() => {
    const savedTemplateId = localStorage.getItem('preferredTemplateId');
    if (savedTemplateId && !selectedTemplateId) {
      setSelectedTemplateId(savedTemplateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch default template if none is selected
  useEffect(() => {
    const fetchDefaultTemplate = async () => {
      // Only fetch if we don't have a template selected yet
      if (selectedTemplateId !== null) return;

      try {
        const response = await fetch('/api/templates?limit=1');
        if (response.ok) {
          const { templates } = await response.json();
          if (templates && templates.length > 0) {
            const defaultTemplate = templates[0];
            setSelectedTemplateId(defaultTemplate.id);
            console.log('Using default template:', defaultTemplate.name);
          }
        }
      } catch (error) {
        console.error('Error fetching default template:', error);
      }
    };

    fetchDefaultTemplate();
  }, [selectedTemplateId]);

  // Fetch resume data and default template if resumeId is provided
  useEffect(() => {
    if (resumeId) {
      const fetchResume = async () => {
        try {
          const response = await fetch(`/api/resumes/${resumeId}`);
          if (response.ok) {
            const data = await response.json();
            setResume(data.content as Resume);
            // Set default template if available and not already selected
            if (data.templateId && selectedTemplateId === null) {
              setSelectedTemplateId(data.templateId);
              localStorage.setItem('preferredTemplateId', data.templateId);
            }
          }
        } catch (error) {
          console.error('Error fetching resume:', error);
        }
      };
      fetchResume();
    }
    // Only run on mount or when resumeId/localPreviewKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, localPreviewKey]);

  // Update resume when resumeData prop changes
  useEffect(() => {
    setResume(resumeData);
  }, [resumeData]);

  // Update preview key when prop changes
  useEffect(() => {
    setLocalPreviewKey(previewKey);
  }, [previewKey]);

  // Hook for template preview rendering (only when not using custom template)
  const { htmlContent: fetchedHtmlContent, isLoading, error } = useTemplatePreview({
    templateId: templateHtml ? null : selectedTemplateId, // Skip fetching if custom template provided
    resumeData: resume,
  });

  // Render custom template HTML/CSS if provided (for TemplateEditor live preview)
  const customHtmlContent = useMemo(() => {
    if (!templateHtml) return null;
    
    try {
      return renderTemplateClientSide({
        htmlTemplate: templateHtml,
        cssStyles: templateCss || '',
        resumeData: resume,
      });
    } catch (err) {
      console.error('Error rendering custom template:', err);
      return null;
    }
  }, [templateHtml, templateCss, resume]);

  // Use custom HTML if provided, otherwise use fetched template
  const htmlContent = customHtmlContent || fetchedHtmlContent;

  // Calculate pages when iframe loads
  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const iframe = iframeRef.current;
      
      // Wait for iframe to load and content to render
      const handleLoad = () => {
        // Use setTimeout to ensure content is fully rendered
        setTimeout(() => {
          try {
            const totalPagesCalculated = setupIframePagination(iframe, A4_HEIGHT);
            if (totalPagesCalculated !== null) {
              console.log('Calculated pages:', totalPagesCalculated);
              setTotalPages(totalPagesCalculated);
              // Reset to page 1 when content changes
              setCurrentPage(1);
            }
          } catch (error) {
            console.error('Error calculating pages:', error);
          }
        }, 100); // Small delay to ensure rendering is complete
      };

      iframe.addEventListener('load', handleLoad);
      // Also trigger immediately in case iframe is already loaded
      handleLoad();
      
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [htmlContent]);

  // Scroll to current page using iframe document scrolling
  useEffect(() => {
    if (iframeRef.current && currentPage > 0 && htmlContent) {
      try {
        const iframe = iframeRef.current;
        
        // Wait a bit for iframe to fully load
        const timer = setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              // Use the pagination utility to scroll to the page
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

  const handleTemplateChange = async (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    
    // Save to localStorage for all scenarios
    if (templateId) {
      localStorage.setItem('preferredTemplateId', templateId);
    }
    
    // Save template selection to resume if resumeId is available
    if (resumeId && templateId) {
      try {
        const response = await fetch(`/api/resumes/${resumeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId }),
        });
        
        if (!response.ok) {
          console.error('Failed to save template selection');
        }
      } catch (error) {
        console.error('Error saving template:', error);
      }
    }
    
    if (onTemplateChange) {
      onTemplateChange(templateId);
    }
  };

  const handleRefresh = () => {
    setLocalPreviewKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

   
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen]);

  const handleExportPDF = async () => {
    if (!resumeId) {
      toast.error('Resume ID is required to export PDF');
      return;
    }

    try {
      setIsExportingPDF(true);

      const response = await fetch(`/api/resumes/${resumeId}/export`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const PreviewContent = () => {
    const renderMainPreviewState = () => {
      if (isLoading) {
        return (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Loading template...
          </div>
        );
      }
      if (error) {
        return (
          <div className="absolute inset-0 flex items-center justify-center text-destructive">
            {error}
          </div>
        );
      }
      if (htmlContent) {
        return (
          <>
            <div 
              ref={containerRef}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                style={{
                  width: A4_WIDTH,
                  height: A4_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center',
                }}
                className="relative"
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  className="w-full h-full border-0"
                  title="Template Preview"
                  sandbox="allow-same-origin"
                  style={{
                    width: `${A4_WIDTH}px`,
                    height: `${A4_HEIGHT}px`,
                    overflow: 'hidden',
                  }}
                />
              </div>
            </div>
            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
            />
          </>
        );
      }
      return (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          No preview available
        </div>
      );
    };

    return (
      <>
        {/* Header with Template Selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {showTemplateSelector && !templateHtml && (
              <PreviewTemplateSelector
                selectedTemplateId={selectedTemplateId}
                onTemplateChange={handleTemplateChange}
                variant="outline"
                size="sm"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {resumeId && !templateHtml && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExportingPDF ? 'Exporting...' : 'Download PDF'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title="View in modal"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Expand
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Preview Area with A4 Aspect Ratio */}
        <div className="flex flex-col items-center justify-center w-full min-h-[600px]">
          <div 
            className="relative bg-white rounded-lg shadow-lg w-full"
            style={{ 
              aspectRatio: '210/297',
              maxWidth: '794px',
            }}
          >
            {renderMainPreviewState()}
          </div>
        </div>
      </>
    );
  };

  if (showCard) {
    return (
      <>
        <Card className={className}>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>See how your resume looks with different templates</CardDescription>
          </CardHeader>
          <CardContent>
            <PreviewContent />
          </CardContent>
        </Card>

        {/* Modal Overlay */}
        {isFullscreen && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={toggleFullscreen}
            onKeyDown={(e) => e.key === 'Escape' && toggleFullscreen()}
            role="button"
            tabIndex={0}
          >
            <div 
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-background/80 hover:bg-background"
                onClick={toggleFullscreen}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* A4 Preview Container */}
              <div 
                className="relative bg-white rounded-lg shadow-2xl"
                style={{ 
                  aspectRatio: '210/297',
                  maxHeight: '95%',
                  width: 'auto',
                }}
              >
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Loading template...
                  </div>
                ) : (
                  (() => {
                    let modalContent;
                    if (isLoading) {
                      modalContent = (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          Loading template...
                        </div>
                      );
                    } else if (error) {
                      modalContent = (
                        <div className="absolute inset-0 flex items-center justify-center text-destructive">
                          {error}
                        </div>
                      );
                    } else if (htmlContent) {
                      modalContent = (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center ">
                            <div
                              style={{
                                width: A4_WIDTH,
                                height: A4_HEIGHT,
                                transform: `scale(${scale})`,
                                transformOrigin: 'center center',
                              }}
                              className="relative"
                            >
                              <iframe
                                ref={iframeRef}
                                srcDoc={htmlContent}
                                className="w-full h-full border-0"
                                title="Template Preview Modal"
                                sandbox="allow-same-origin"
                                style={{
                                  width: `${A4_WIDTH}px`,
                                  height: `${A4_HEIGHT}px`,
                                  overflow: 'hidden',
                                }}
                              />
                            </div>
                          </div>
                          {/* Pagination Controls */}
                          <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                          />
                        </>
                      );
                    } else {
                      modalContent = (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          No preview available
                        </div>
                      );
                    }
                    return modalContent;
                  })()
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Regular preview content (non-card mode) */}
      <PreviewContent />

      {/* Modal Overlay for non-card mode */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={toggleFullscreen}
          onKeyDown={(e) => e.key === 'Escape' && toggleFullscreen()}
          role="button"
          tabIndex={0}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-background/80 hover:bg-background"
              onClick={toggleFullscreen}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* A4 Preview Container */}
            <div 
              className="relative bg-white rounded-lg shadow-2xl"
              style={{ 
                aspectRatio: '210/297',
                maxHeight: '95%',
                width: 'auto',
              }}
            >
              {(() => {
                if (isLoading) {
                  return (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      Loading template...
                    </div>
                  );
                }

                if (error) {
                  return (
                    <div className="absolute inset-0 flex items-center justify-center text-destructive">
                      {error}
                    </div>
                  );
                }

                if (htmlContent) {
                  return (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          style={{
                            width: A4_WIDTH,
                            height: A4_HEIGHT,
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                          }}
                          className="relative"
                        >
                          <iframe
                            ref={iframeRef}
                            srcDoc={htmlContent}
                            className="w-full h-full border-0"
                            title="Template Preview Modal"
                            sandbox="allow-same-origin"
                            style={{
                              width: `${A4_WIDTH}px`,
                              height: `${A4_HEIGHT}px`,
                              overflow: 'hidden',
                            }}
                          />
                        </div>
                      </div>
                      {/* Pagination Controls */}
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                      />
                    </>
                  );
                }

                return (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    No preview available
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
