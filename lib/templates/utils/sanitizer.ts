/**
 * Template Sanitization Utilities
 *
 * Templates are user-authored (Handlebars + HTML + CSS) and later rendered server-side.
 * This module applies minimal, targeted sanitization to reduce XSS/SSRF risk while
 * preserving the ability to write templates.
 */

export type SanitizedTemplate = {
  htmlTemplate: string;
  cssStyles: string;
};

const MAX_TEMPLATE_LENGTH = 200_000;

function assertReasonableLength(value: string, label: string) {
  if (value.length > MAX_TEMPLATE_LENGTH) {
    throw new Error(`${label} is too large`);
  }
}

/**
 * Remove patterns that are dangerous in a user-provided HTML template.
 *
 * Notes:
 * - This is not a full HTML sanitizer.
 * - It focuses on blocking obvious script execution and external loads.
 * - Handlebars placeholders ({{...}} / {{{...}}}) are preserved.
 */
export function sanitizeTemplateHtml(htmlTemplate: string): string {
  assertReasonableLength(htmlTemplate, 'HTML template');

  let html = htmlTemplate;

  // Remove script tags entirely.
  html = html.replaceAll(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');

  // Remove inline event handlers. (e.g. onclick="..." / onload='...')
  html = html.replaceAll(/\son[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g, '');

  // Block javascript: URLs in href/src attributes.
  html = html.replaceAll(
    /(\s(?:href|src)\s*=\s*)("|')\s*javascript:[\s\S]*?\2/gi,
    '$1$2#$2'
  );

  // Strip <iframe> tags.
  html = html.replaceAll(/<\s*iframe\b[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '');
  html = html.replaceAll(/<\s*iframe\b[^>]*\/\s*>/gi, '');

  // Strip <object>/<embed> tags.
  html = html.replaceAll(/<\s*object\b[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '');
  html = html.replaceAll(/<\s*embed\b[^>]*\/\s*>/gi, '');

  return html;
}

/**
 * Sanitize user-provided CSS.
 *
 * Goal: reduce obvious exfil/external-load vectors while allowing normal styling.
 * - Removes @import.
 * - Removes url(http/https/...) and url(//...).
 * - Keeps data: URLs for embedded fonts/images.
 */
export function sanitizeTemplateCss(cssStyles: string): string {
  assertReasonableLength(cssStyles, 'CSS styles');

  let css = cssStyles;

  // Drop @import rules.
  css = css.replaceAll(/@import\s+[^;]+;/gi, '');

  // Remove external URLs while still allowing data:.
  css = css.replaceAll(/url\(\s*("|')?\s*(https?:)?\/\/[\s\S]*?("|')?\s*\)/gi, '');

  return css;
}

export function sanitizeTemplate(template: SanitizedTemplate): SanitizedTemplate {
  return {
    htmlTemplate: sanitizeTemplateHtml(template.htmlTemplate),
    cssStyles: sanitizeTemplateCss(template.cssStyles),
  };
}
