/**
 * Minimal Resume Template
 * 
 * Ultra-clean design with generous whitespace and subtle typography.
 * Best for: Designers, creatives, and roles where simplicity is valued.
 * 
 * Template assets are stored in: ./assets/minimal/
 * - template.html: Handlebars HTML template
 * - styles.css: Template-specific CSS
 */

import { loadTemplate } from './loader';

// Load template from external files
const template = loadTemplate('minimal');

/** Minimal template HTML (Handlebars format) */
export const minimalTemplateHtml = template.html;

/** Minimal template CSS (includes base styles) */
export const minimalTemplateCss = template.css;
