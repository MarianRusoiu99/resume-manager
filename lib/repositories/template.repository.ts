/**
 * Template Repository
 * Handles data access for resume templates
 */

import { prisma } from '@/lib/db';
import type { ResumeTemplate, TemplateDefinition } from '@/types/template';
import { Prisma } from '@prisma/client';

export class TemplateRepository {
  /**
   * Get all public templates
   */
  async findAllPublic(): Promise<ResumeTemplate[]> {
    const templates = await prisma.resumeTemplate.findMany({
      where: { isPublic: true },
      orderBy: [{ atsScore: 'desc' }, { name: 'asc' }],
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
        category,
      },
      orderBy: [{ atsScore: 'desc' }, { name: 'asc' }],
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
    category: string;
    description: string;
    definition: TemplateDefinition;
    previewUrl?: string;
    atsScore?: number;
    isPublic?: boolean;
  }): Promise<ResumeTemplate> {
    const template = await prisma.resumeTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        definition: data.definition as unknown as Prisma.JsonObject,
        previewUrl: data.previewUrl,
        atsScore: data.atsScore ?? 8,
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
      category: string;
      description: string;
      definition: TemplateDefinition;
      previewUrl: string;
      atsScore: number;
      isPublic: boolean;
    }>
  ): Promise<ResumeTemplate> {
    const updateData: Prisma.ResumeTemplateUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.definition !== undefined)
      updateData.definition = data.definition as unknown as Prisma.JsonObject;
    if (data.previewUrl !== undefined) updateData.previewUrl = data.previewUrl;
    if (data.atsScore !== undefined) updateData.atsScore = data.atsScore;
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
   * Map Prisma model to domain model
   */
  private mapToTemplate(template: {
    id: string;
    name: string;
    category: string;
    description: string;
    definition: Prisma.JsonValue;
    previewUrl: string | null;
    isPublic: boolean;
    version: string;
    atsScore: number;
    createdAt: Date;
    updatedAt: Date;
  }): ResumeTemplate {
    return {
      id: template.id,
      name: template.name,
      category: template.category as 'professional' | 'modern' | 'creative' | 'ats-optimized' | 'minimal',
      description: template.description,
      definition: template.definition as unknown as TemplateDefinition,
      previewUrl: template.previewUrl ?? undefined,
      isPublic: template.isPublic,
      version: template.version,
      atsScore: template.atsScore,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}

// Singleton instance
export const templateRepository = new TemplateRepository();
