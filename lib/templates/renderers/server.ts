/**
 * Server-Side Template Renderer
 * Renders HTML templates with resume data for server components
 * Used for public profile pages to render with the user's selected template
 */

import { renderCompleteDocument } from '@/lib/templates/renderer';
import { templateRepository } from '@/lib/repositories/templates.repository';
import type { Resume } from '@/lib/validations/jsonresume';
import type { ResumeTemplate } from '@/lib/templates/template';

/**
 * Options for server-side template rendering
 */
interface ServerRenderOptions {
  /** Resume data to render */
  resumeData: Resume;
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
