/**
 * Template Repository
 * 
 * Implements ITemplateRepository for data access abstraction.
 * Handles data access for resume templates.
 */

import { prisma } from '@/lib/db/index';
import type { ResumeTemplate } from '@/lib/templates/template';
import { PrismaClient, Prisma } from '@prisma/client';
import { GenericRepository } from './generic.repository';
import type { ITemplateRepository, CreateTemplateInput, UpdateTemplateInput } from './interfaces/template.repository.interface';

/**
 * Template Repository Implementation
 */
export class TemplateRepository 
  extends GenericRepository<ResumeTemplate, CreateTemplateInput, UpdateTemplateInput, any>
  implements ITemplateRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('resumeTemplate', dbClient);
  }
  /**
   * Get all public templates
   */
  async findAllPublic(): Promise<ResumeTemplate[]> {
    const templates = await this.delegate.findMany({
      where: { isPublic: true },
      orderBy: [{ name: 'asc' }],
    });

    return templates.map((t: any) => this.mapToTemplate(t));
  }

  /**
   * Get template by ID
   */
  override async findById(id: string): Promise<ResumeTemplate | null> {
    const template = await this.delegate.findUnique({
      where: { id },
    });

    return template ? this.mapToTemplate(template) : null;
  }

  /**
   * Create a new template
   */
  override async create(data: CreateTemplateInput): Promise<ResumeTemplate> {
    const template = await this.delegate.create({
      data: {
        name: data.name,
        description: data.description,
        htmlTemplate: data.htmlTemplate,
        cssStyles: data.cssStyles,
        previewUrl: data.previewUrl,
        isPublic: data.isPublic ?? true,
      },
    });

    return this.mapToTemplate(template);
  }

  /**
   * Update template
   */
  override async update(
    id: string,
    data: UpdateTemplateInput
  ): Promise<ResumeTemplate> {
    const updateData: Prisma.ResumeTemplateUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.htmlTemplate !== undefined) updateData.htmlTemplate = data.htmlTemplate;
    if (data.cssStyles !== undefined) updateData.cssStyles = data.cssStyles;
    if (data.previewUrl !== undefined) updateData.previewUrl = data.previewUrl;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    const template = await this.delegate.update({
      where: { id },
      data: updateData,
    });

    return this.mapToTemplate(template);
  }

  /**
   * Delete template
   */
  override async delete(id: string): Promise<ResumeTemplate> {
    const template = await this.findById(id);
    if (!template) throw new Error('Template not found');

    await this.delegate.delete({
      where: { id },
    });

    return template;
  }

  /**
   * Check if a template is in use by any resumes
   */
  async isInUse(templateId: string): Promise<boolean> {
    const count = await this.db.resume.count({
      where: { templateId },
    });
    return count > 0;
  }

  /**
   * Map Prisma model to domain model
   */
  private mapToTemplate(template: {
    id: string;
    name: string;
    description: string | null;
    htmlTemplate: string;
    cssStyles: string;
    previewUrl: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ResumeTemplate {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      htmlTemplate: template.htmlTemplate,
      cssStyles: template.cssStyles,
      previewUrl: template.previewUrl ?? undefined,
      isPublic: template.isPublic,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}

// Singleton instance
export const templateRepository = new TemplateRepository();
