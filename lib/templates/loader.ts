import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NotFoundError } from '@/lib/errors';

/** Loaded template content */
export interface TemplateContent {
  html: string;
  css: string;
}

/** Available template names */
export type TemplateName = 'minimal' | 'classic' | 'modern';

/**
 * Get the assets directory path
 */
function getAssetsPath(): string {
  return join(process.cwd(), 'lib', 'templates', 'assets');
}

/**
 * Load the base CSS that applies to all templates
 */
export function loadBaseCss(): string {
  const basePath = join(getAssetsPath(), 'base.css');
  return readFileSync(basePath, 'utf-8');
}

/**
 * Load a template's HTML and CSS from external files
 * 
 * @param templateName - Name of the template folder
 * @returns Template HTML and combined CSS (base + template-specific)
 * 
 * @example
 * ```ts
 * const { html, css } = loadTemplate('minimal');
 * ```
 */
export function loadTemplate(templateName: TemplateName): TemplateContent {
  const assetsPath = getAssetsPath();
  const templatePath = join(assetsPath, templateName);
  
  const html = readFileSync(join(templatePath, 'template.html'), 'utf-8');
  const templateCss = readFileSync(join(templatePath, 'styles.css'), 'utf-8');
  const baseCss = loadBaseCss();
  
  // Combine base CSS with template-specific CSS
  const css = `${baseCss}\n\n${templateCss}`;
  
  return { html, css };
}

/**
 * Load all templates at once
 * Useful for build-time operations
 */
export function loadAllTemplates(): Record<TemplateName, TemplateContent> {
  const templates: TemplateName[] = ['minimal', 'classic', 'modern'];
  
  return templates.reduce((acc, name) => {
    acc[name] = loadTemplate(name);
    return acc;
  }, {} as Record<TemplateName, TemplateContent>);
}

/**
 * Validate that all template files exist
 * Throws if any files are missing
 */
export function validateTemplateAssets(): void {
  const templates: TemplateName[] = ['minimal', 'classic', 'modern'];
  const assetsPath = getAssetsPath();
  
  // Check base.css
  const baseCssPath = join(assetsPath, 'base.css');
  try {
    readFileSync(baseCssPath, 'utf-8');
  } catch {
    throw new NotFoundError(`Base CSS file: ${baseCssPath}`);
  }
  
  // Check each template
  for (const template of templates) {
    const templatePath = join(assetsPath, template);
    
    const htmlPath = join(templatePath, 'template.html');
    const cssPath = join(templatePath, 'styles.css');
    
    try {
      readFileSync(htmlPath, 'utf-8');
    } catch {
      throw new NotFoundError(`Template HTML file for "${template}": ${htmlPath}`);
    }
    
    try {
      readFileSync(cssPath, 'utf-8');
    } catch {
      throw new NotFoundError(`Template CSS file for "${template}": ${cssPath}`);
    }
  }
}
