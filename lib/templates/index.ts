/**
 * Resume Templates Index
 * 
 * Exports all default resume templates for seeding and application use.
 */

export { classicTemplateHtml, classicTemplateCss } from './classic';
export { modernTemplateHtml, modernTemplateCss } from './modern';
export { minimalTemplateHtml, minimalTemplateCss } from './minimal';

/**
 * Default templates configuration for seeding
 */
export const defaultTemplates = [
  {
    name: 'Classic',
    category: 'PROFESSIONAL' as const,
    description: 'Traditional serif-based design with clean typography. Perfect for corporate, legal, academic, and traditional industries where a timeless look is valued.',
    templateKey: 'classic',
  },
  {
    name: 'Modern',
    category: 'MODERN' as const,
    description: 'Clean sans-serif design with blue accent colors and modern typography. Ideal for tech, startups, design, and progressive companies.',
    templateKey: 'modern',
  },
  {
    name: 'Minimal',
    category: 'MINIMAL' as const,
    description: 'Ultra-clean design with generous whitespace and subtle typography. Best for designers, creatives, and roles where simplicity is valued.',
    templateKey: 'minimal',
  },
];
