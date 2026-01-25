/**
 * Template Renderer
 * Renders HTML templates with resume data using Handlebars
 */

import Handlebars from 'handlebars';
import type { Resume } from '@/lib/validations/jsonresume';
import { sanitizeTemplateHtml } from '@/lib/templates/utils/sanitizer';
import type { DeepPartial } from '@/lib/types';
import { ValidationError } from '@/lib/errors';

import { loadBaseCss } from './loader';

/**
 * Auto-corrects common Handlebars syntax errors
 */
export function autoCorrectTemplate(template: string): string {
  let corrected = template;

  // Fix {{#if a || b}} -> {{#if (|| a b)}}
  // This is a simple regex fix for common 2-operand cases
  corrected = corrected.replace(
    /\{\{#if\s+([^}]+)\s+\|\|\s+([^}]+)\}\}/g,
    '{{#if (|| $1 $2)}}'
  );

  // Fix {{#if a && b}} -> {{#if (&& a b)}}
  corrected = corrected.replace(
    /\{\{#if\s+([^}]+)\s+&&\s+([^}]+)\}\}/g,
    '{{#if (&& $1 $2)}}'
  );

  return corrected;
}

/**
 * Validates Handlebars template syntax before compilation
 * to prevent the AI from generating invalid logical operators or malformed blocks.
 */
export function validateHandlebarsSyntax(template: string): void {
  // Check for common illegal patterns like {{#if a || b}}
  // Handlebars doesn't support logical operators directly in expressions
  const illegalOperators = /\{\{#if\s+[^}]*(\|\||&&|!|===|==|!=)/;
  if (illegalOperators.test(template)) {
    // Log the error for debugging but don't throw yet to see if we can just fix it
    console.warn('Illegal Handlebars syntax detected, attempting to auto-correct...');
  }

  try {
    Handlebars.precompile(template);
  } catch (error: any) {
    throw new ValidationError(`Handlebars syntax error: ${error.message}`);
  }
}

/**
 * Renders the full HTML structure for PDF export
 */
function renderPDFDocument(html: string, css: string, resumeData: Resume | DeepPartial<Resume>): string {
  const name = resumeData.basics?.name || 'Resume';
  const baseCss = loadBaseCss();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${name}</title>
        <style>
            ${baseCss}
            ${css}
            @media print {
                body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                @page { margin: 0; }
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
  // Safe array iterator
  Handlebars.registerHelper('safeEach', function(this: unknown, context: unknown[], options: Handlebars.HelperOptions) {
    if (!context || !Array.isArray(context) || context.length === 0) {
      return options.inverse(this);
    }
    return context.map((item) => options.fn(item)).join('');
  });

  // Safe value checker
  Handlebars.registerHelper('safeIf', function(this: unknown, value: unknown, options: Handlebars.HelperOptions) {
    if (value !== undefined && value !== null && value !== '') {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  // Safe nested property access
  Handlebars.registerHelper('safeGet', function(this: unknown, context: any, path: string, options: Handlebars.HelperOptions) {
    if (!context || !path) return options.inverse(this);
    
    const value = path.split('.').reduce((acc, part) => {
      return acc && acc[part];
    }, context);
    
    if (value !== undefined && value !== null && value !== '') {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  // Format date helper
  Handlebars.registerHelper('formatDate', function(dateString: string | undefined) {
    if (!dateString) return 'Present';
    try {
      const parts = dateString.split('-');
      if (parts.length === 1) return parts[0]; // Just year
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[Number.parseInt(parts[1]) - 1];
      return `${month} ${parts[0]}`;
    } catch {
      return dateString;
    }
  });

  // Format date range helper
  Handlebars.registerHelper('dateRange', function(startDate: string | undefined, endDate: string | undefined) {
    const formatDate = (date: string | undefined) => {
      if (!date) return 'Present';
      try {
        const parts = date.split('-');
        if (parts.length === 1) return parts[0];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[Number.parseInt(parts[1]) - 1];
        return `${month} ${parts[0]}`;
      } catch {
        return date;
      }
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

  // Logical OR helper
  const orHelper = function(...args: any[]) {
    args.pop(); // Remove Handlebars options
    return args.some(v => !!v);
  };
  Handlebars.registerHelper('or', orHelper);
  Handlebars.registerHelper('||', orHelper);

  // Logical AND helper
  const andHelper = function(...args: any[]) {
    args.pop(); // Remove Handlebars options
    return args.every(v => !!v);
  };
  Handlebars.registerHelper('and', andHelper);
  Handlebars.registerHelper('&&', andHelper);

  // Date helper - simplified single-line date range
  Handlebars.registerHelper('date', function(startDate: string | undefined, endDate: string | undefined) {
    if (!startDate && !endDate) return '';
    
    const format = (date: string | undefined) => {
      if (!date) return 'Present';
      if (typeof date === 'string' && date.toLowerCase() === 'present') return 'Present';
      try {
        const parts = String(date).split('-');
        if (parts.length === 1) return parts[0];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = Number.parseInt(parts[1]) - 1;
        const month = months[monthIndex] || parts[1];
        return `${month} ${parts[0]}`;
      } catch {
        return date;
      }
    };

    if (startDate && !endDate) {
      return `${format(startDate)} — Present`;
    }
    
    if (!startDate && endDate) {
      return format(endDate);
    }

    return `${format(startDate)} — ${format(endDate)}`;
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
export function renderTemplate(htmlTemplate: string, resumeData: Resume | DeepPartial<Resume>): string {
  // Auto-correct common errors first
  const correctedTemplate = autoCorrectTemplate(htmlTemplate);

  // Validate syntax before compilation
  validateHandlebarsSyntax(correctedTemplate);

  // First, sanitize the template to remove malicious scripts
  const safeHtmlTemplate = sanitizeTemplateHtml(correctedTemplate);
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
  resumeData: Resume | DeepPartial<Resume>
): string {
  const renderedContent = renderTemplate(htmlTemplate, resumeData);
  return renderPDFDocument(renderedContent, '', resumeData);
}
