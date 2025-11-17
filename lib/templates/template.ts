/**
 * Resume Template Type Definitions
 * Simplified template system using HTML/CSS themes
 */
import { TemplateCategory } from "@prisma/client";

export interface TemplateMetadata {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  isPublic: boolean;
  previewUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeTemplate extends TemplateMetadata {
  /** Handlebars HTML template */
  htmlTemplate: string;
  /** CSS styles for the template */
  cssStyles: string;
}
