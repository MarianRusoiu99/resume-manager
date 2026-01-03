/**
 * Template Service Interface
 * 
 * Defines the contract for template business logic operations.
 */

import type { ResumeTemplate } from '@/lib/templates/template';
import type { ServiceResult } from '@/lib/types/service-result';

/**
 * Input for creating a template
 */
export interface CreateTemplateServiceInput {
  name: string;
  description?: string;
  htmlTemplate: string;
  previewUrl?: string;
  isPublic?: boolean;
}

/**
 * Input for updating a template
 */
export interface UpdateTemplateServiceInput {
  name?: string;
  description?: string;
  htmlTemplate?: string;
  previewUrl?: string;
  isPublic?: boolean;
}

/**
 * Template Service Interface
 */
export interface ITemplateService {
  /**
   * Get all public templates
   */
  getAllPublicTemplates(): Promise<ServiceResult<ResumeTemplate[]>>;

  /**
   * Get a template by ID
   */
  getTemplateById(id: string): Promise<ServiceResult<ResumeTemplate>>;

  /**
   * Create a new template
   */
  createTemplate(input: CreateTemplateServiceInput): Promise<ServiceResult<ResumeTemplate>>;

  /**
   * Update a template
   */
  updateTemplate(
    id: string,
    input: UpdateTemplateServiceInput
  ): Promise<ServiceResult<ResumeTemplate>>;

  /**
   * Delete a template
   */
  deleteTemplate(id: string): Promise<ServiceResult<void>>;

  /**
   * Duplicate a template
   */
  duplicateTemplate(id: string): Promise<ServiceResult<ResumeTemplate>>;
}
