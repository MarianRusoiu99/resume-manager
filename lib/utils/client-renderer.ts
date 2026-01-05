/**
 * Client-Side Template Rendering Utility
 * Renders HTML templates with resume data via server action
 * to avoid CSP issues with Handlebars.compile() requiring eval
 */

import { renderTemplate } from '@/app/actions/template';
import type { Resume } from '@/lib/validations/jsonresume';

interface RenderTemplateOptions {
  htmlTemplate: string;
  resumeData: Resume;
}

/**
 * Render template via server action
 * This avoids CSP issues since Handlebars.compile() runs on the server
 * @throws Error if rendering fails
 */
export async function renderTemplateServerSide({
  htmlTemplate,
  resumeData,
}: RenderTemplateOptions): Promise<string> {
  const result = await renderTemplate(htmlTemplate, resumeData);
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to render template');
  }
  
  return result.data;
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
