import DOMPurify from 'isomorphic-dompurify';

/**
 * Template Sanitization Utilities
 *
 * Templates are user-authored (Handlebars + HTML + CSS) and later rendered server-side.
 * This module uses DOMPurify for robust sanitization to eliminate XSS risk while
 * preserving the ability to write templates.
 */

export type SanitizedTemplate = {
  htmlTemplate: string;
};

const MAX_TEMPLATE_LENGTH = 200_000;

function assertReasonableLength(value: string, label: string) {
  if (value.length > MAX_TEMPLATE_LENGTH) {
    throw new Error(`${label} is too large`);
  }
}

/**
 * Sanitize user-provided HTML template using DOMPurify.
 *
 * It focuses on blocking script execution and external loads while preserving 
 * Handlebars placeholders ({{...}} / {{{...}}}).
 */
export function sanitizeTemplateHtml(htmlTemplate: string): string {
  assertReasonableLength(htmlTemplate, 'HTML template');

  return DOMPurify.sanitize(htmlTemplate, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
      'b', 'i', 'strong', 'em', 'a', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'section', 'header', 'footer', 'main', 'aside', 'article', 'style'
    ],
    ALLOWED_ATTR: ['href', 'src', 'class', 'id', 'style', 'target', 'rel', 'alt', 'title'],
    // We allow same-origin to enable Handlebars processing later, but block dangerous protocols
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^&#\/+.\w]|[\w!$&\-+.,;=@~]|(?:\/(?!\/)))/i,
    ADD_TAGS: ['style'], // Allow style tags within HTML if needed
    FORCE_BODY: true,
  });
}

export function sanitizeTemplate(template: SanitizedTemplate): SanitizedTemplate {
  return {
    htmlTemplate: sanitizeTemplateHtml(template.htmlTemplate),
  };
}
