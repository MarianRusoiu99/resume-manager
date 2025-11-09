/**
 * Resume HTML Preview Component
 * Renders HTML template with resume data in an iframe
 */

'use client';

import React, { useEffect, useRef } from 'react';
import type { Resume } from '@/lib/validations/jsonresume';

interface ResumePreviewProps {
  htmlContent: string;
  className?: string;
}

/**
 * Preview component that renders HTML content in an isolated iframe
 * This ensures template styles don't conflict with the app's styles
 */
export function ResumePreview({ htmlContent, className = '' }: ResumePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Write content to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
    }
  }, [htmlContent]);

  return (
    <div className={`${className}`}>
      <iframe
        ref={iframeRef}

        title="Resume Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

interface ResumePreviewLoaderProps {
  resumeData: Resume;
  templateHtml: string;
  templateCss: string;
  className?: string;
}

/**
 * Preview component that fetches and renders the complete HTML
 * This version handles the template rendering on the client side
 */
export function ResumePreviewLoader({
  resumeData,
  templateHtml,
  templateCss,
  className,
}: ResumePreviewLoaderProps) {
  const [htmlContent, setHtmlContent] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    async function renderTemplate() {
      try {
        setIsLoading(true);
        setError(null);

        // Call API to render the template
        const response = await fetch('/api/templates/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateHtml,
            templateCss,
            resumeData,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to render template');
        }

        const { html } = await response.json();
        setHtmlContent(html);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render template');
      } finally {
        setIsLoading(false);
      }
    }

    renderTemplate();
  }, [resumeData, templateHtml, templateCss]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Rendering preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center text-destructive">
          <p className="font-semibold mb-2">Failed to load preview</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return <ResumePreview htmlContent={htmlContent} className={className} />;
}
