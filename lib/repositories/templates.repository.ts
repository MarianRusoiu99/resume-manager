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
import { RecordNotFoundError } from '@/lib/errors/database';
import { TransactionClient } from '@/lib/db/transaction';
import type { ITemplateRepository, CreateTemplateInput, UpdateTemplateInput } from './interfaces/templates.repository.interface';

/**
 * Template Repository Implementation
 */
export class TemplateRepository 
  extends GenericRepository<ResumeTemplate, CreateTemplateInput, UpdateTemplateInput, 'resumeTemplate', Prisma.ResumeTemplateDelegate>
  implements ITemplateRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('resumeTemplate', dbClient);
  }
  /**
   * Get all public templates
   */
  async findAllPublic(tx?: TransactionClient): Promise<ResumeTemplate[]> {
    const templates = await this.getDelegate(tx).findMany({
      where: { isPublic: true },
      orderBy: [{ name: 'asc' }],
    });

    return (templates as unknown as Array<Prisma.ResumeTemplateGetPayload<Record<string, never>>>).map((t) => this.mapToTemplate(t));
  }

  /**
   * Get template by ID
   */
  override async findById(id: string, userId?: string, tx?: TransactionClient): Promise<ResumeTemplate | null> {
    const template = await this.getDelegate(tx).findUnique({
      where: { id },
    });

    return template ? this.mapToTemplate(template as unknown as Prisma.ResumeTemplateGetPayload<Record<string, never>>) : null;
  }

  /**
   * Create a new template
   */
  override async create(data: CreateTemplateInput, tx?: TransactionClient): Promise<ResumeTemplate> {
    const template = await this.getDelegate(tx).create({
      data: {
        name: data.name,
        description: data.description,
        htmlTemplate: data.htmlTemplate,
        previewUrl: data.previewUrl,
        isPublic: data.isPublic ?? true,
      },
    });

    return this.mapToTemplate(template as unknown as Prisma.ResumeTemplateGetPayload<Record<string, never>>);
  }

  /**
   * Update template
   */
  override async update(
    id: string,
    data: UpdateTemplateInput,
    userId?: string,
    tx?: TransactionClient
  ): Promise<ResumeTemplate> {
    const updateData: Prisma.ResumeTemplateUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.htmlTemplate !== undefined) updateData.htmlTemplate = data.htmlTemplate;
    if (data.previewUrl !== undefined) updateData.previewUrl = data.previewUrl;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    const template = await this.getDelegate(tx).update({
      where: { id },
      data: updateData,
    });

    return this.mapToTemplate(template as unknown as Prisma.ResumeTemplateGetPayload<Record<string, never>>);
  }

  /**
   * Delete template
   */
  override async delete(id: string, userId?: string, tx?: TransactionClient): Promise<ResumeTemplate> {
    const template = await this.findById(id, userId, tx);
    if (!template) {
      throw new RecordNotFoundError('ResumeTemplate', id, 'delete');
    }

    await this.getDelegate(tx).delete({
      where: { id },
    });

    return template;
  }

  /**
   * Check if a template is in use by any resumes
   */
  async isInUse(templateId: string, tx?: TransactionClient): Promise<boolean> {
    const client = tx || (this.db as TransactionClient);
    const count = await client.resume.count({
      where: { templateId },
    });
    return count > 0;
  }

  /**
   * Map Prisma model to domain model
   */
  private mapToTemplate(template: Prisma.ResumeTemplateGetPayload<Record<string, never>>): ResumeTemplate {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      htmlTemplate: template.htmlTemplate,
      previewUrl: template.previewUrl ?? undefined,
      isPublic: template.isPublic,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}


// Singleton instance
export const templateRepository = new TemplateRepository();
