/**
 * Template Repository Interface
 * 
 * Defines the contract for template data access operations.
 */

import type { ResumeTemplate } from '@/lib/templates/template';

/**
 * Input for creating a template
 */
export interface CreateTemplateInput {
  name: string;
  description?: string;
  htmlTemplate: string;
  previewUrl?: string;
  isPublic?: boolean;
}

/**
 * Input for updating a template
 */
export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  htmlTemplate?: string;
  previewUrl?: string;
  isPublic?: boolean;
}

/**
 * Template Repository Interface
 */
export interface ITemplateRepository {
  /**
   * Get all public templates
   */
  findAllPublic(): Promise<ResumeTemplate[]>;

  /**
   * Get template by ID
   */
  findById(id: string): Promise<ResumeTemplate | null>;

  /**
   * Create a new template
   */
  create(data: CreateTemplateInput): Promise<ResumeTemplate>;

  /**
   * Update template
   */
  update(id: string, data: UpdateTemplateInput): Promise<ResumeTemplate>;

  /**
   * Delete template
   */
  delete(id: string): Promise<ResumeTemplate>;

  /**
   * Check if a template is in use
   */
  isInUse(templateId: string): Promise<boolean>;
}
