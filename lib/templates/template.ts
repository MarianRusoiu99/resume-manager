/**
 * Resume Template Type Definitions
 * Simplified template system using HTML/CSS themes
 */

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  previewUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeTemplate extends TemplateMetadata {
  /** Handlebars HTML template (includes styles) */
  htmlTemplate: string;
}
