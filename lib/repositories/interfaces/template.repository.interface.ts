/**
 * Template Repository Interface
 * 
 * Defines the contract for template data access operations.
 */

import type { ResumeTemplate } from '@/lib/templates/template';
import { TemplateCategory } from '@prisma/client';

/**
 * Input for creating a template
 */
export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  description: string;
  htmlTemplate: string;
  cssStyles: string;
  previewUrl?: string;
  isPublic?: boolean;
}

/**
 * Input for updating a template
 */
export interface UpdateTemplateInput {
  name?: string;
  category?: TemplateCategory;
  description?: string;
  htmlTemplate?: string;
  cssStyles?: string;
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
   * Get templates by category
   */
  findByCategory(category: string): Promise<ResumeTemplate[]>;

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
  delete(id: string): Promise<void>;

  /**
   * Count templates by category
   */
  countByCategory(): Promise<Record<string, number>>;

  /**
   * Check if a template is in use
   */
  isInUse(templateId: string): Promise<boolean>;

  /**
   * Get all unique categories
   */
  getCategories(): Promise<string[]>;
}
