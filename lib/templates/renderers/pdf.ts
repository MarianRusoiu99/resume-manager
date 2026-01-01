/**
 * PDF Renderer Utility
 * Single Responsibility: Generate print-optimized HTML for PDF export
 * Used by both preview and server-side PDF generation for consistency
 */

import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Generate complete HTML document optimized for PDF printing
 * This is the single source of truth for PDF rendering
 */
export function renderPDFDocument(
  htmlContent: string,
  cssStyles: string,
  resumeData: Resume
): string {
  const title = resumeData.basics?.name || 'Resume';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* === Reset === */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* === PDF Page Setup === */
    @page {
      size: A4;
      margin: 20mm 15mm;
    }

    html {
      width: 210mm;
      margin: 0;
      padding: 0;
    }

    body {
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #222;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
    }

    /* === Print Optimization === */
    @media print {
      html, body {
        width: 210mm;
        height: auto;
      }

      /* Prevent awkward page breaks */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        break-after: avoid;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Keep sections together when possible */
      section, .section, .resume-section {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 1.5rem;
      }

      /* Allow natural breaks in lists */
      ul, ol {
        page-break-inside: auto;
        break-inside: auto;
      }

      /* Orphans and widows control */
      p, li {
        orphans: 3;
        widows: 3;
      }

      /* Ensure links are visible in print */
      a {
        color: #000;
        text-decoration: none;
      }

      /* Remove backgrounds to save ink */
      * {
        background: transparent !important;
        box-shadow: none !important;
      }

      /* Ensure proper spacing */
      section + section,
      .section + .section {
        margin-top: 1.5rem;
      }
    }

    /* === Typography === */
    h1 {
      margin-bottom: 0.5rem;
      font-size: 2rem;
      font-weight: 700;
    }

    h2 {
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-size: 1.5rem;
      font-weight: 600;
    }

    h3 {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      font-size: 1.2rem;
      font-weight: 600;
    }

    p {
      margin-bottom: 0.5rem;
    }

    ul, ol {
      margin-bottom: 0.75rem;
      padding-left: 1.5rem;
    }

    li {
      margin-bottom: 0.25rem;
    }

    /* === Custom Template Styles === */
    ${cssStyles}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
}

/**
 * Extract configuration for PDF generation
 */
export const PDF_CONFIG = {
  format: 'A4' as const,
  printBackground: true,
  margin: {
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
  },
  preferCSSPageSize: true,
  scale: 1,
} as const;

/**
 * A4 dimensions for viewport sizing
 */
export const A4_DIMENSIONS = {
  width: 794,  // A4 width in pixels at 96 DPI
  height: 1123 // A4 height in pixels at 96 DPI
} as const;
