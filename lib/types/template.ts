/**
 * Template Type Definitions
 * 
 * Centralized template types used across the application.
 * This avoids duplicate interface definitions in multiple files.
 */

/**
 * Base template information (for lists, dropdowns, selectors)
 */
export interface TemplateBase {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Full template with rendering assets
 */
export interface Template extends TemplateBase {
  htmlTemplate: string;
  cssStyles: string;
}

/**
 * Template with metadata (from database)
 */
export interface TemplateWithMeta extends Template {
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Template preview data (minimal for card displays)
 */
export interface TemplatePreview {
  id: string;
  name: string;
  previewHtml?: string;
}
