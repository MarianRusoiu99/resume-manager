import { templateRepository } from '@/lib/repositories/template.repository';
import type { ResumeTemplate } from '@/lib/templates/template';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// Validation schemas
const templateCategorySchema = z.enum(['PROFESSIONAL', 'MODERN', 'CREATIVE', 'ATS_OPTIMIZED', 'MINIMAL']);

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: templateCategorySchema,
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  htmlTemplate: z.string().min(1, 'HTML template is required'),
  cssStyles: z.string().min(1, 'CSS styles are required'),
  previewUrl: z.string().url('Invalid preview URL').optional(),
  isPublic: z.boolean().default(true),
});

const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

/**
 * Service for managing resume templates
 */
export class TemplateService {
  /**
   * Get all public templates
   */
  async getAllPublicTemplates(): Promise<{
    success: boolean;
    data?: ResumeTemplate[];
    error?: string;
  }> {
    try {
      const templates = await templateRepository.findAllPublic();
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      logger.error('Error fetching templates', error);
      return {
        success: false,
        error: 'Failed to fetch templates',
      };
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<{
    success: boolean;
    data?: ResumeTemplate[];
    error?: string;
  }> {
    try {
      const templates = await templateRepository.findByCategory(category);
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      logger.error('Error fetching templates by category', error);
      return {
        success: false,
        error: 'Failed to fetch templates',
      };
    }
  }

  /**
   * Get a template by ID
   */
  async getTemplateById(id: string): Promise<{
    success: boolean;
    data?: ResumeTemplate;
    error?: string;
  }> {
    try {
      const template = await templateRepository.findById(id);

      if (!template) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      return {
        success: true,
        data: template,
      };
    } catch (error) {
      logger.error('Error fetching template', error);
      return {
        success: false,
        error: 'Failed to fetch template',
      };
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(input: CreateTemplateInput): Promise<{
    success: boolean;
    data?: ResumeTemplate;
    error?: string;
  }> {
    try {
      // Validate input
      const validatedData = createTemplateSchema.parse(input);

      // Create template
      const template = await templateRepository.create(validatedData);

      return {
        success: true,
        data: template,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues.map((e) => e.message).join(', '),
        };
      }

      logger.error('Error creating template', error);
      return {
        success: false,
        error: 'Failed to create template',
      };
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(
    id: string,
    input: UpdateTemplateInput
  ): Promise<{
    success: boolean;
    data?: ResumeTemplate;
    error?: string;
  }> {
    try {
      // Check if template exists
      const existing = await templateRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      // Validate input
      const validatedData = updateTemplateSchema.parse(input);

      // Update template
      const template = await templateRepository.update(id, validatedData);

      return {
        success: true,
        data: template,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues.map((e) => e.message).join(', '),
        };
      }

      logger.error('Error updating template', error);
      return {
        success: false,
        error: 'Failed to update template',
      };
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if template exists
      const existing = await templateRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      // Check if template is in use
      const inUse = await templateRepository.isInUse(id);
      if (inUse) {
        return {
          success: false,
          error: 'Cannot delete template that is in use by resumes',
        };
      }

      // Delete template
      await templateRepository.delete(id);

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Error deleting template', error);
      return {
        success: false,
        error: 'Failed to delete template',
      };
    }
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<{
    success: boolean;
    data?: string[];
    error?: string;
  }> {
    try {
      const categories = await templateRepository.getCategories();
      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      logger.error('Error fetching categories', error);
      return {
        success: false,
        error: 'Failed to fetch categories',
      };
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
