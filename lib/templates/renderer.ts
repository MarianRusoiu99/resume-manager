/**
 * Template Renderer
 * Renders HTML templates with resume data using Handlebars
 */

import Handlebars from 'handlebars';
import type { Resume } from '@/lib/validations/jsonresume';
import { renderPDFDocument } from '@/lib/utils/pdf-renderer';
import { sanitizeTemplateCss, sanitizeTemplateHtml } from '@/lib/utils/template-sanitizer';

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
 */
export function renderTemplate(htmlTemplate: string, resumeData: Resume): string {
  const safeHtmlTemplate = sanitizeTemplateHtml(htmlTemplate);
  const template = Handlebars.compile(safeHtmlTemplate);
  return template(resumeData);
}

/**
 * Render complete HTML document with styles
 * @param htmlTemplate - HTML template for resume content
 * @param cssStyles - CSS styles for the template
 * @param resumeData - JSON Resume format data
 * @returns Complete HTML document string
 */
export function renderCompleteDocument(
  htmlTemplate: string,
  cssStyles: string,
  resumeData: Resume
): string {
  const renderedContent = renderTemplate(htmlTemplate, resumeData);
  const safeCss = sanitizeTemplateCss(cssStyles);
  return renderPDFDocument(renderedContent, safeCss, resumeData);
}