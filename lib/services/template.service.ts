import { TemplateRepository, templateRepository } from '@/lib/repositories/template.repository';
import type { ResumeTemplate } from '@/lib/templates/template';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { success, failure, type ServiceResult } from '@/lib/types/service-result';
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
    try {
      const templates = await this.repository.findAllPublic();
      return success(templates);
    } catch (error) {
      logger.error('Error fetching templates', error);
      return failure('Failed to fetch templates', 'INTERNAL_ERROR');
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<ServiceResult<ResumeTemplate[]>> {
    try {
      const templates = await this.repository.findByCategory(category);
      return success(templates);
    } catch (error) {
      logger.error('Error fetching templates by category', error);
      return failure('Failed to fetch templates', 'INTERNAL_ERROR');
    }
  }

  /**
   * Get a template by ID
   */
  async getTemplateById(id: string): Promise<ServiceResult<ResumeTemplate>> {
    try {
      const template = await this.repository.findById(id);

      if (!template) {
        return failure('Template not found', 'NOT_FOUND');
      }

      return success(template);
    } catch (error) {
      logger.error('Error fetching template', error);
      return failure('Failed to fetch template', 'INTERNAL_ERROR');
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(input: CreateTemplateInput): Promise<ServiceResult<ResumeTemplate>> {
    try {
      // Validate input
      const validatedData = createTemplateSchema.parse(input);

      // Create template
      const template = await this.repository.create(validatedData);

      return success(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return failure(error.issues.map((e) => e.message).join(', '), 'VALIDATION_ERROR');
      }

      logger.error('Error creating template', error);
      return failure('Failed to create template', 'INTERNAL_ERROR');
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(
    id: string,
    input: UpdateTemplateInput
  ): Promise<ServiceResult<ResumeTemplate>> {
    try {
      // Check if template exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        return failure('Template not found', 'NOT_FOUND');
      }

      // Validate input
      const validatedData = updateTemplateSchema.parse(input);

      // Update template
      const template = await this.repository.update(id, validatedData);

      return success(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return failure(error.issues.map((e) => e.message).join(', '), 'VALIDATION_ERROR');
      }

      logger.error('Error updating template', error);
      return failure('Failed to update template', 'INTERNAL_ERROR');
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<ServiceResult<void>> {
    try {
      // Check if template exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        return failure('Template not found', 'NOT_FOUND');
      }

      // Check if template is in use
      const inUse = await this.repository.isInUse(id);
      if (inUse) {
        return failure('Cannot delete template that is in use by resumes', 'CONFLICT');
      }

      // Delete template
      await this.repository.delete(id);

      return success(undefined);
    } catch (error) {
      logger.error('Error deleting template', error);
      return failure('Failed to delete template', 'INTERNAL_ERROR');
    }
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<ServiceResult<string[]>> {
    try {
      const categories = await this.repository.getCategories();
      return success(categories);
    } catch (error) {
      logger.error('Error fetching categories', error);
      return failure('Failed to fetch categories', 'INTERNAL_ERROR');
    }
  }

  /**
   * Get template counts by category
   */
  async getCategoryCounts(): Promise<ServiceResult<Record<string, number>>> {
    try {
      const counts = await this.repository.countByCategory();
      return success(counts);
    } catch (error) {
      logger.error('Error fetching category counts', error);
      return failure('Failed to fetch category counts', 'INTERNAL_ERROR');
    }
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
