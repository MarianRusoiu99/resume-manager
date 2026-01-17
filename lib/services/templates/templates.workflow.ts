import { TemplateRepository, templateRepository } from '@/lib/repositories/templates.repository';
import { ExternalServiceError } from "@/lib/errors";
import type { ResumeTemplate } from '@/lib/templates/template';
import { type ServiceResult, isFailure } from '@/lib/types';
import { withServiceError, ConflictError } from '@/lib/services/utils';
import type { ITemplateService } from '../interfaces';
import type { CreateTemplateInput, UpdateTemplateInput } from '@/lib/validations/api-schemas';

import { validateCreateTemplateInput, validateUpdateTemplateInput } from './validation';
import { validateHandlebarsTemplateSyntax } from './syntax';
import { sanitizeTemplate } from '@/lib/templates/utils/sanitizer';
import { GenericCrudService } from '../utils/generic-crud.service';
import { getCacheProvider } from '@/lib/redis/client';

const TEMPLATE_CACHE_KEY = 'templates:public';
const TEMPLATE_CACHE_TTL = 300; // 5 minutes

/**
 * Service for managing resume templates
 *
 * Implements ITemplateService with constructor injection.
 */
export class TemplateService 
  extends GenericCrudService<ResumeTemplate, CreateTemplateInput, UpdateTemplateInput, Record<string, unknown>, TemplateRepository>
  implements ITemplateService 
{
  constructor(
    repository: TemplateRepository = templateRepository
  ) {
    super(repository, 'Template');
  }

  /**
   * Get all public templates with caching
   */
  async getAllPublicTemplates(): Promise<ServiceResult<ResumeTemplate[]>> {
    return withServiceError('fetch templates', async () => {
      // Try to get from cache first
      const cache = getCacheProvider();
      const cached = await cache.get<string>(TEMPLATE_CACHE_KEY);
      
      if (cached) {
        try {
          return JSON.parse(cached) as ResumeTemplate[];
        } catch {
          // If parsing fails, invalidate cache and fetch from DB
          await cache.delete(TEMPLATE_CACHE_KEY);
        }
      }
      
      // Fetch from database
      const templates = await this.repository.findAllPublic();
      
      // Cache the results
      await cache.set(
        TEMPLATE_CACHE_KEY,
        JSON.stringify(templates),
        TEMPLATE_CACHE_TTL
      );
      
      return templates;
    });
  }

  /**
   * Get a template by ID
   */
  async getTemplateById(id: string): Promise<ServiceResult<ResumeTemplate>> {
    return this.getById(id);
  }

  /**
   * Create a new template
   */
  async createTemplate(input: CreateTemplateInput): Promise<ServiceResult<ResumeTemplate>> {
    return withServiceError('create template', async () => {
      const validatedData = validateCreateTemplateInput(input);
      const sanitized = sanitizeTemplate({
        htmlTemplate: validatedData.htmlTemplate,
      });

      const template = await this.repository.create({
        ...validatedData,
        htmlTemplate: sanitized.htmlTemplate,
      });
      
      // Invalidate cache
      const cache = getCacheProvider();
      await cache.delete(TEMPLATE_CACHE_KEY);
      
      return template;
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
      const existingResult = await this.getById(id);
      if (isFailure(existingResult)) throw new ExternalServiceError('Template Workflow', existingResult.error);
      const existing = existingResult.data;

      const validatedData = validateUpdateTemplateInput(input);

      // Sanitize only the fields that can introduce script execution.
      const sanitized = sanitizeTemplate({
        htmlTemplate: validatedData.htmlTemplate ?? existing.htmlTemplate,
      });

      const template = await this.repository.update(id, {
        ...validatedData,
        ...(validatedData.htmlTemplate === undefined ? {} : { htmlTemplate: sanitized.htmlTemplate }),
      });
      
      // Invalidate cache
      const cache = getCacheProvider();
      await cache.delete(TEMPLATE_CACHE_KEY);
      
      return template;
    });
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<ServiceResult<void>> {
    return withServiceError('delete template', async () => {
      const existingResult = await this.getById(id);
      if (isFailure(existingResult)) throw new ExternalServiceError('Template Workflow', existingResult.error);

      const inUse = await this.repository.isInUse(id);
      if (inUse) {
        throw new ConflictError('Cannot delete template that is in use by resumes');
      }

      await this.repository.delete(id);
      
      // Invalidate cache
      const cache = getCacheProvider();
      await cache.delete(TEMPLATE_CACHE_KEY);
    });
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(id: string): Promise<ServiceResult<ResumeTemplate>> {
    return withServiceError('duplicate template', async () => {
      const existingResult = await this.getById(id);
      if (isFailure(existingResult)) throw new ExternalServiceError('Template Workflow', existingResult.error);
      const existing = existingResult.data;

      return await this.repository.create({
        name: `${existing.name} (Copy)`,
        description: existing.description ?? undefined,
        htmlTemplate: existing.htmlTemplate,
        isPublic: false,
        previewUrl: existing.previewUrl ?? undefined,
      });
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
