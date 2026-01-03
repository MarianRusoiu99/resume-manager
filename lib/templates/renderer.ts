/**
 * Template Renderer
 * Renders HTML templates with resume data using Handlebars
 */

import Handlebars from 'handlebars';
import type { Resume } from '@/lib/validations/jsonresume';
import { sanitizeTemplateHtml } from '@/lib/templates/utils/sanitizer';

/**
 * Renders the full HTML structure for PDF export
 */
function renderPDFDocument(html: string, css: string, resumeData: Resume): string {
  const name = resumeData.basics?.name || 'Resume';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${name}</title>
        <style>
            ${css}
            @media print {
                body { margin: 0; padding: 0; }
                @page { margin: 0.4in; }
            }
        </style>
    </head>
    <body>
        ${html}
    </body>
    </html>
  `;
}

/**
 * Register Handlebars helpers for common formatting tasks
 */
function registerHelpers() {
  // Format date helper
  Handlebars.registerHelper('formatDate', function(dateString: string | undefined) {
    if (!dateString) return 'Present';
    
    const parts = dateString.split('-');
    if (parts.length === 1) return parts[0]; // Just year
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[Number.parseInt(parts[1]) - 1];
    return `${month} ${parts[0]}`;
  });

  // Format date range helper
  Handlebars.registerHelper('dateRange', function(startDate: string | undefined, endDate: string | undefined) {
    const formatDate = (date: string | undefined) => {
      if (!date) return 'Present';
      const parts = date.split('-');
      if (parts.length === 1) return parts[0];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[Number.parseInt(parts[1]) - 1];
      return `${month} ${parts[0]}`;
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  });

  // Format location helper
  Handlebars.registerHelper('formatLocation', function(location?: {
    address?: string;
    postalCode?: string;
    city?: string;
    countryCode?: string;
    region?: string;
  }) {
    if (!location) return '';
    const parts = [location.city, location.region, location.countryCode].filter(Boolean);
    return parts.join(', ');
  });

  // Check if array has items
  Handlebars.registerHelper('hasItems', function(array: unknown) {
    return Array.isArray(array) && array.length > 0;
  });

  // Join array with separator
  Handlebars.registerHelper('join', function(array: string[], separator: string) {
    if (!Array.isArray(array)) return '';
    return array.join(separator);
  });
}

// Register helpers on module load
registerHelpers();

/**
 * Render HTML template with resume data
 * @param htmlTemplate - HTML template string with {{placeholders}}
 * @param resumeData - JSON Resume format data
 * @returns Rendered HTML string
 * 
 * Security: Sanitizes BOTH the template AND the final output to prevent XSS.
 * The template is sanitized first to remove malicious scripts in the template itself,
 * then the final output is sanitized to prevent XSS from user-provided resume data
 * (e.g., name, summary, etc.) that gets inserted via Handlebars placeholders.
 */
export function renderTemplate(htmlTemplate: string, resumeData: Resume): string {
  // First, sanitize the template to remove malicious scripts
  const safeHtmlTemplate = sanitizeTemplateHtml(htmlTemplate);
  const template = Handlebars.compile(safeHtmlTemplate);
  const renderedHtml = template(resumeData);
  
  // Sanitize the final output to prevent XSS from user-provided data
  // This is critical because Handlebars inserts user data AFTER template sanitization
  return sanitizeTemplateHtml(renderedHtml);
}

/**
 * Render complete HTML document with styles
 * @param htmlTemplate - HTML template for resume content (including <style> blocks)
 * @param resumeData - JSON Resume format data
 * @returns Complete HTML document string
 */
export function renderCompleteDocument(
  htmlTemplate: string,
  resumeData: Resume
): string {
  const renderedContent = renderTemplate(htmlTemplate, resumeData);
  return renderPDFDocument(renderedContent, '', resumeData);
}