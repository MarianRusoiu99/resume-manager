/**
 * Fullscreen Modal Component
 * Single Responsibility: Display resume preview in fullscreen mode
 */

'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RefObject } from 'react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { A4_WIDTH, A4_HEIGHT } from '@/lib/utils/pagination';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  fullscreenIframeRef: RefObject<HTMLIFrameElement | null>;
}

export function FullscreenModal({
  isOpen,
  onClose,
  htmlContent,
  currentPage,
  totalPages,
  onPageChange,
  fullscreenIframeRef,
}: Readonly<FullscreenModalProps>) {
  if (!htmlContent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <div className="relative h-[95vh] flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-center min-h-full p-8">
              <div
                style={{
                  width: A4_WIDTH,
                  height: A4_HEIGHT,
                }}
                className="shadow-2xl"
              >
                <iframe
                  ref={fullscreenIframeRef}
                  srcDoc={htmlContent}
                  className="w-full h-full border-0"
                  title="Fullscreen Preview"
                  sandbox="allow-same-origin"
                  style={{
                    width: `${A4_WIDTH}px`,
                    height: `${A4_HEIGHT}px`,
                  }}
                />
              </div>
            </div>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            className="py-4"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
