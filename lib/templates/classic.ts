/**
 * Classic Resume Template
 * 
 * Traditional serif-based design with clean typography.
 * Best for: Corporate, legal, academic, and traditional industries.
 * 
 * Template assets are stored in: ./assets/classic/
 * - template.html: Handlebars HTML template
 * - styles.css: Template-specific CSS
 */

import { loadTemplate } from './loader';

// Load template from external files
const template = loadTemplate('classic');

/** Classic template HTML (Handlebars format) */
export const classicTemplateHtml = template.html;

/** Classic template CSS (includes base styles) */
export const classicTemplateCss = template.css;
