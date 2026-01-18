/**
 * Template Repository Interface
 * 
 * Defines the contract for template data access operations.
 */

import type { ResumeTemplate } from '@/lib/templates/template';
import { TransactionClient } from '@/lib/db/transaction';

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
  findAllPublic(tx?: TransactionClient): Promise<ResumeTemplate[]>;

  /**
   * Get template by ID
   */
  findById(id: string, userId?: string, tx?: TransactionClient): Promise<ResumeTemplate | null>;

  /**
   * Create a new template
   */
  create(data: CreateTemplateInput, tx?: TransactionClient): Promise<ResumeTemplate>;

  /**
   * Update template
   */
  update(id: string, data: UpdateTemplateInput, userId?: string, tx?: TransactionClient): Promise<ResumeTemplate>;

  /**
   * Delete template
   */
  delete(id: string, userId?: string, tx?: TransactionClient): Promise<ResumeTemplate>;

  /**
   * Check if a template is in use
   */
  isInUse(templateId: string, tx?: TransactionClient): Promise<boolean>;
}
