/**
 * Modern Resume Template
 * 
 * Clean sans-serif design with blue accent colors and modern typography.
 * Best for: Tech, startups, design, and progressive companies.
 * 
 * Template assets are stored in: ./assets/modern/
 * - template.html: Handlebars HTML template
 * - styles.css: Template-specific CSS
 */

import { loadTemplate } from './loader';

// Load template from external files
const template = loadTemplate('modern');

/** Modern template HTML (Handlebars format) */
export const modernTemplateHtml = template.html;

/** Modern template CSS (includes base styles) */
export const modernTemplateCss = template.css;
