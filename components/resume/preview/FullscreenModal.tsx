/**
 * Fullscreen Modal Component
 * Responsible for displaying preview in fullscreen mode
 * Single Responsibility: Fullscreen modal overlay
 */

'use client';

import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { X } from 'lucide-react';
import { PreviewIframe } from './PreviewIframe';
import { PreviewState } from './PreviewState';

interface FullscreenModalProps {
  /** Show modal */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** HTML content */
  htmlContent: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Current page */
  currentPage: number;
  /** Total pages */
  totalPages: number;
  /** Scale factor */
  scale: number;
  /** Page change callback */
  onPageChange: (page: number) => void;
}

export const FullscreenModal = forwardRef<HTMLIFrameElement, FullscreenModalProps>(
  (
    {
      isOpen,
      onClose,
      htmlContent,
      isLoading,
      error,
      currentPage,
      totalPages,
      scale,
      onPageChange,
    },
    iframeRef
  ) => {
    if (!isOpen) return null;

    const handleBackdropClick = () => {
      onClose();
    };

    const handleContentClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const renderModalContent = () => {
      if (isLoading) {
        return <PreviewState type="loading" />;
      }

      if (error) {
        return <PreviewState type="error" message={error} />;
      }

      if (htmlContent) {
        return (
          <>
            <PreviewIframe
              ref={iframeRef}
              htmlContent={htmlContent}
              scale={scale}
              title="Template Preview Modal"
            />
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
            />
          </>
        );
      }

      return <PreviewState type="empty" />;
    };

    return (
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        role="button"
        aria-label="Close modal backdrop"
        tabIndex={0}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          onClick={handleContentClick}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-background/80 hover:bg-background"
            onClick={onClose}
            aria-label="Close fullscreen preview"
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
            {renderModalContent()}
          </div>
        </div>
      </div>
    );
  }
);

FullscreenModal.displayName = 'FullscreenModal';
