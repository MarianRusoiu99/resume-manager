/**
 * Preview Iframe Component
 * Responsible for rendering the resume iframe with proper scaling
 * Single Responsibility: Display scaled iframe content
 */

'use client';

import { forwardRef } from 'react';
import { A4_WIDTH, A4_HEIGHT } from '@/lib/utils/pagination';

interface PreviewIframeProps {
  htmlContent: string;
  scale: number;
  title?: string;
}

export const PreviewIframe = forwardRef<HTMLIFrameElement, PreviewIframeProps>(
  ({ htmlContent, scale, title = 'Template Preview' }, ref) => {
    return (
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
            ref={ref}
            srcDoc={htmlContent}
            className="w-full h-full border-0"
            title={title}
            sandbox="allow-same-origin allow-scripts"
            style={{
              width: `${A4_WIDTH}px`,
              height: `${A4_HEIGHT}px`,
            }}
          />
        </div>
      </div>
    );
  }
);

PreviewIframe.displayName = 'PreviewIframe';
