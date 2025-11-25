/**
 * Template Repository
 * Handles data access for resume templates
 */

import { prisma } from '@/lib/db';
import type { ResumeTemplate } from '@/lib/templates/template';
import { Prisma, TemplateCategory } from '@prisma/client';


export class TemplateRepository {
  /**
   * Get all public templates
   */
  async findAllPublic(): Promise<ResumeTemplate[]> {
    const templates = await prisma.resumeTemplate.findMany({
      where: { isPublic: true },
      orderBy: [{ name: 'asc' }],
    });

    return templates.map((t) => this.mapToTemplate(t));
  }

  /**
   * Get templates by category
   */
  async findByCategory(category: string): Promise<ResumeTemplate[]> {
    const templates = await prisma.resumeTemplate.findMany({
      where: {
        isPublic: true,
        category: category as TemplateCategory,
      },
      orderBy: [{ name: 'asc' }],
    });

    return templates.map((t) => this.mapToTemplate(t));
  }

  /**
   * Get template by ID
   */
  async findById(id: string): Promise<ResumeTemplate | null> {
    const template = await prisma.resumeTemplate.findUnique({
      where: { id },
    });

    return template ? this.mapToTemplate(template) : null;
  }

  /**
   * Create a new template
   */
  async create(data: {
    name: string;
    category: TemplateCategory;
    description: string;
    htmlTemplate: string;
    cssStyles: string;
    previewUrl?: string;
    isPublic?: boolean;
  }): Promise<ResumeTemplate> {
    const template = await prisma.resumeTemplate.create({
      data: {
        name: data.name,
        category: data.category,
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
  async update(
    id: string,
    data: Partial<{
      name: string;
      category: TemplateCategory;
      description: string;
      htmlTemplate: string;
      cssStyles: string;
      previewUrl: string;
      isPublic: boolean;
    }>
  ): Promise<ResumeTemplate> {
    const updateData: Prisma.ResumeTemplateUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) {
      // Map lowercase category to Prisma enum
      const categoryMap: Record<string, string> = {
        'professional': 'PROFESSIONAL',
        'modern': 'MODERN',
        'creative': 'CREATIVE',
        'ats-optimized': 'ATS_OPTIMIZED',
        'minimal': 'MINIMAL',
      };
      // Accept both enum and string
      if (typeof data.category === 'string' && categoryMap[data.category]) {
        updateData.category = categoryMap[data.category] as TemplateCategory;
      } else {
        updateData.category = data.category;
      }
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.htmlTemplate !== undefined) updateData.htmlTemplate = data.htmlTemplate;
    if (data.cssStyles !== undefined) updateData.cssStyles = data.cssStyles;
    if (data.previewUrl !== undefined) updateData.previewUrl = data.previewUrl;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    const template = await prisma.resumeTemplate.update({
      where: { id },
      data: updateData,
    });

    return this.mapToTemplate(template);
  }

  /**
   * Delete template
   */
  async delete(id: string): Promise<void> {
    await prisma.resumeTemplate.delete({
      where: { id },
    });
  }

  /**
   * Count templates by category
   */
  async countByCategory(): Promise<Record<string, number>> {
    const templates = await prisma.resumeTemplate.groupBy({
      by: ['category'],
      where: { isPublic: true },
      _count: true,
    });

    return templates.reduce(
      (acc: Record<string, number>, item: { category: string; _count: number }) => {
        acc[item.category] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Check if a template is in use by any resumes
   */
  async isInUse(templateId: string): Promise<boolean> {
    const count = await prisma.generatedResume.count({
      where: { templateId },
    });
    return count > 0;
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const categories = await prisma.resumeTemplate.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return categories.map((c) => c.category);
  }

  /**
   * Map Prisma model to domain model
   */
  private mapToTemplate(template: {
    id: string;
    name: string;
    category: TemplateCategory;
    description: string;
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
      category: template.category,
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
