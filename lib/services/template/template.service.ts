import { TemplateRepository, templateRepository } from '@/lib/repositories/template.repository';
import type { ResumeTemplate } from '@/lib/templates/template';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, NotFoundError, ConflictError } from '@/lib/services/utils';
import type { ITemplateService } from '../interfaces';
import type { CreateTemplateInput, UpdateTemplateInput } from '@/lib/validations/api-schemas';

import { validateCreateTemplateInput, validateUpdateTemplateInput } from './validation';
import { validateHandlebarsTemplateSyntax } from './syntax';

/**
 * Service for managing resume templates
 *
 * Implements ITemplateService with constructor injection.
 */
export class TemplateService implements ITemplateService {
  constructor(
    private readonly repository: TemplateRepository = templateRepository
  ) {}

  /**
   * Get all public templates
   */
  async getAllPublicTemplates(): Promise<ServiceResult<ResumeTemplate[]>> {
    return withServiceError('fetch templates', async () => {
      return await this.repository.findAllPublic();
    });
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<ServiceResult<ResumeTemplate[]>> {
    return withServiceError('fetch templates by category', async () => {
      return await this.repository.findByCategory(category);
    });
  }

  /**
   * Get a template by ID
   */
  async getTemplateById(id: string): Promise<ServiceResult<ResumeTemplate>> {
    return withServiceError('fetch template', async () => {
      const template = await this.repository.findById(id);
      if (!template) {
        throw new NotFoundError('Template');
      }
      return template;
    });
  }

  /**
   * Create a new template
   */
  async createTemplate(input: CreateTemplateInput): Promise<ServiceResult<ResumeTemplate>> {
    return withServiceError('create template', async () => {
      const validatedData = validateCreateTemplateInput(input);
      return await this.repository.create(validatedData);
    });
  }

  /**
   * Update a template
   */
  async updateTemplate(
    id: string,
    input: UpdateTemplateInput
  ): Promise<ServiceResult<ResumeTemplate>> {
    return withServiceError('update template', async () => {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new NotFoundError('Template');
      }

      const validatedData = validateUpdateTemplateInput(input);
      return await this.repository.update(id, validatedData);
    });
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<ServiceResult<void>> {
    return withServiceError('delete template', async () => {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new NotFoundError('Template');
      }

      const inUse = await this.repository.isInUse(id);
      if (inUse) {
        throw new ConflictError('Cannot delete template that is in use by resumes');
      }

      await this.repository.delete(id);
    });
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<ServiceResult<string[]>> {
    return withServiceError('fetch categories', async () => {
      return await this.repository.getCategories();
    });
  }

  /**
   * Get template counts by category
   */
  async getCategoryCounts(): Promise<ServiceResult<Record<string, number>>> {
    return withServiceError('fetch category counts', async () => {
      return await this.repository.countByCategory();
    });
  }

  /**
   * Validate Handlebars template syntax
   */
  validateTemplateSyntax(htmlTemplate: string): {
    valid: boolean;
    errors: string[];
  } {
    return validateHandlebarsTemplateSyntax(htmlTemplate);
  }
}

// Export singleton instance
export const templateService = new TemplateService();
