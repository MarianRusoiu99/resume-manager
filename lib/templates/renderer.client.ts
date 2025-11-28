/**
 * Client-Side Template Renderer
 * Renders HTML templates with resume data using Handlebars (browser-compatible)
 */

'use client';

import Handlebars from 'handlebars';
import type { Resume } from '@/lib/validations/jsonresume';

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

// Register helpers once when module loads
if (typeof window !== 'undefined') {
  registerHelpers();
}

/**
 * Render HTML template with resume data (client-side)
 * @param htmlTemplate - HTML template string with {{placeholders}}
 * @param resumeData - JSON Resume format data
 * @returns Rendered HTML string
 */
export function renderTemplateClient(htmlTemplate: string, resumeData: Resume): string {
  const template = Handlebars.compile(htmlTemplate);
  return template(resumeData);
}

/**
 * Render complete HTML document with styles (client-side)
 * @param htmlTemplate - HTML template for resume content
 * @param cssStyles - CSS styles for the template
 * @param resumeData - JSON Resume format data
 * @returns Complete HTML document string
 */
export function renderCompleteDocumentClient(
  htmlTemplate: string,
  cssStyles: string,
  resumeData: Resume
): string {
  const renderedContent = renderTemplateClient(htmlTemplate, resumeData);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${resumeData.basics?.name || 'Resume'}</title>
  <style>
    /* === Reset === */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* === A4 Setup === */
    @page {
      size: A4;
      margin: 0;
    }

    html {
      width: 210mm;
      min-height: 297mm;
      padding: 2cm;
  margin: 1cm auto;
      background: #fff;
      color: #222;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12.5px;
      line-height: 1.5;
      /* Hide scrollbars but allow scrolling */
      overflow-y: auto;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
    }

    html::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }

    body {
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 20mm 15mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: visible;
    }

    /* === Print Optimization === */
    @media print {
      html, body {
        width: 210mm;
        min-height: 297mm;
      }

      body {
        padding: 15mm;
      }

      a {
        color: #000 !important;
        text-decoration: none;
      }

      /* Allow content to break across pages naturally */
      section, div, ul, li {
        page-break-inside: avoid;
      }
    }

    /* === External Custom CSS === */
    ${cssStyles}
  </style>
</head>
<body>
  ${renderedContent}
</body>
</html>`;
}
