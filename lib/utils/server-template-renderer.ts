/**
 * Server-Side Template Renderer
 * Renders HTML templates with resume data for server components
 * Used for public profile pages to render with the user's selected template
 */

import { renderCompleteDocument } from '@/lib/templates/renderer';
import { templateRepository } from '@/lib/repositories/template.repository';
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
  /** Whether to include a watermark with link */
  includeWatermark?: boolean;
  /** Custom watermark URL */
  watermarkUrl?: string;
  /** Custom watermark text */
  watermarkText?: string;
}

/**
 * Default watermark configuration
 */
const DEFAULT_WATERMARK = {
  url: 'https://github.com/MarianRusoiu99/resume-manager',
  text: 'Built with Resume Manager',
};

/**
 * Generate watermark HTML for public profiles
 */
function generateWatermarkHtml(url: string, text: string): string {
  return `
    <div class="resume-watermark" style="
      position: fixed;
      bottom: 10px;
      right: 10px;
      font-size: 10px;
      color: #666;
      opacity: 0.7;
      z-index: 1000;
      text-decoration: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <a href="${url}" target="_blank" rel="noopener noreferrer" style="
        color: #666;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
        ${text}
      </a>
    </div>
  `;
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
    includeWatermark = false,
    watermarkUrl = DEFAULT_WATERMARK.url,
    watermarkText = DEFAULT_WATERMARK.text,
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
    template.cssStyles,
    resumeData
  );

  // Inject watermark if requested
  if (includeWatermark) {
    const watermarkHtml = generateWatermarkHtml(watermarkUrl, watermarkText);
    // Insert watermark before closing body tag
    html = html.replace('</body>', `${watermarkHtml}</body>`);
  }

  return html;
}

/**
 * Check if a template exists and is available for public use
 */
export async function isTemplateAvailable(templateId: string): Promise<boolean> {
  const template = await templateRepository.findById(templateId);
  return template?.isPublic ?? false;
}
