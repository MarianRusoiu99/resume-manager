import { TemplateRepository, templateRepository } from '@/lib/repositories/template.repository';
import type { ResumeTemplate } from '@/lib/templates/template';
import { z } from 'zod';
import { type ServiceResult } from '@/lib/types/service-result';
import { withServiceError, NotFoundError, ConflictError } from '@/lib/services/utils';
import type { ITemplateService } from './interfaces';

// Validation schemas
const templateCategorySchema = z.enum(['PROFESSIONAL', 'MODERN', 'CREATIVE', 'ATS_OPTIMIZED', 'MINIMAL']);

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: templateCategorySchema,
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  htmlTemplate: z.string().min(1, 'HTML template is required'),
  cssStyles: z.string().min(1, 'CSS styles are required'),
  previewUrl: z.url('Invalid preview URL').optional(),
  isPublic: z.boolean().default(true),
});

const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

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
      // Validate input (ZodError will be caught by withServiceError)
      const validatedData = createTemplateSchema.parse(input);
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
      // Check if template exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new NotFoundError('Template');
      }

      // Validate input (ZodError will be caught by withServiceError)
      const validatedData = updateTemplateSchema.parse(input);
      return await this.repository.update(id, validatedData);
    });
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<ServiceResult<void>> {
    return withServiceError('delete template', async () => {
      // Check if template exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new NotFoundError('Template');
      }

      // Check if template is in use
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
    const errors: string[] = [];

    // Check for unclosed tags
    const openTags = htmlTemplate.match(/{{\s*#/g)?.length || 0;
    const closeTags = htmlTemplate.match(/{{\s*\//g)?.length || 0;

    if (openTags !== closeTags) {
      errors.push('Mismatched Handlebars block helpers (# and /)');
    }

    // Check for basic HTML structure
    if (!htmlTemplate.includes('<html') && !htmlTemplate.includes('<!DOCTYPE')) {
      errors.push('Template should include HTML structure');
    }

    // Check for required JSON Resume placeholders
    const requiredPlaceholders = ['{{basics.name}}', '{{basics.email}}'];
    for (const placeholder of requiredPlaceholders) {
      if (!htmlTemplate.includes(placeholder)) {
        errors.push(`Missing required placeholder: ${placeholder}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const templateService = new TemplateService();
