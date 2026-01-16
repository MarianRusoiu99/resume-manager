/**
 * Server-Side Template Renderer
 * Renders HTML templates with resume data for server components
 * Used for public profile pages to render with the user's selected template
 */

import { renderCompleteDocument } from '@/lib/templates/renderer';
import { templateRepository } from '@/lib/repositories/templates.repository';
import type { Resume } from '@/lib/validations/jsonresume';
import type { ResumeTemplate } from '@/lib/templates/template';
import type { DeepPartial } from '@/lib/types/utils';
import Handlebars from 'handlebars';

// Register Handlebars helpers for safe data access
if (typeof Handlebars !== 'undefined') {
  Handlebars.registerHelper('safeEach', function(this: unknown, context: unknown[], options: Handlebars.HelperOptions) {
    if (!context || !Array.isArray(context) || context.length === 0) {
      return options.inverse(this);
    }
    
    return context.map((item) => options.fn(item)).join('');
  });

  Handlebars.registerHelper('safeIf', function(this: unknown, value: unknown, options: Handlebars.HelperOptions) {
    if (value !== undefined && value !== null && value !== '') {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  
  // New helper for safe nested property access
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

  // Helper to join array elements
  Handlebars.registerHelper('join', function(context: unknown[], separator: string) {
    if (!context || !Array.isArray(context)) return '';
    return context.join(separator || ', ');
  });

  // Helper to format dates
  Handlebars.registerHelper('formatDate', function(dateString: string) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch (e) {
      return dateString;
    }
  });
}

/**
 * Options for server-side template rendering
 */
interface ServerRenderOptions {
  /** Resume data to render */
  resumeData: Resume | DeepPartial<Resume>;
  /** Template to use (if already fetched) */
  template?: ResumeTemplate | null;
  /** Template ID to fetch and use */
  templateId?: string | null;
}


/**
 * Get the first public template as fallback
 */
async function getDefaultTemplate(): Promise<ResumeTemplate | null> {
  const templates = await templateRepository.findAllPublic();
  return templates[0] || null;
}

/**
 * Render resume with template on the server side
 * 
 * @param options - Rendering options
 * @returns Rendered HTML string or null if no template available
 */
export async function renderTemplateServerSide(
  options: ServerRenderOptions
): Promise<string | null> {
  const {
    resumeData,
    template: providedTemplate,
    templateId,
  } = options;

  // Use provided template, fetch by ID, or fallback to default
  let template = providedTemplate;

  if (!template && templateId) {
    template = await templateRepository.findById(templateId);
  }

  template ??= await getDefaultTemplate();

  if (!template) {
    return null;
  }

  // Render the template with resume data
  let html = renderCompleteDocument(
    template.htmlTemplate,
    resumeData
  );

  return html;
}

/**
 * Check if a template exists and is available for public use
 */
export async function isTemplateAvailable(templateId: string): Promise<boolean> {
  const template = await templateRepository.findById(templateId);
  return template?.isPublic ?? false;
}
