/**
 * Client-Side Template Rendering Utility
 * Renders HTML templates with resume data on the client side
 * Eliminates unnecessary API calls for pure rendering operations
 */

import { renderCompleteDocument } from '@/lib/templates/renderer';
import type { Resume } from '@/lib/validations/jsonresume';

interface RenderTemplateOptions {
  htmlTemplate: string;
  cssStyles: string;
  resumeData: Resume;
}

/**
 * Render template on the client side
 * Pure function that doesn't require server round-trip
 */
export function renderTemplateClientSide({
  htmlTemplate,
  cssStyles,
  resumeData,
}: RenderTemplateOptions): string {
  return renderCompleteDocument(htmlTemplate, cssStyles, resumeData);
}

/**
 * Generate a data URL for preview thumbnail
 * Creates a blob URL that can be used as iframe src
 */
export function generatePreviewDataUrl(htmlContent: string): string {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

/**
 * Clean up data URL when no longer needed
 */
export function revokePreviewDataUrl(url: string): void {
  URL.revokeObjectURL(url);
}
