import { PrismaClient, GeneratedResume } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Repository for managing generated resumes in the database
 */
export class GeneratedResumeRepository {
  private db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Create a new generated resume
   */
  async create(data: {
    userId: string;
    jobDescription: string;
    jobMetadata?: Record<string, unknown>;
    resume: Resume;
    templateId?: string;
    templateCustomization?: Record<string, unknown>;
    pdfUrl?: string;
    coverLetter?: string;
    metadata: Record<string, unknown>;
  }): Promise<GeneratedResume> {
    return this.db.generatedResume.create({
      data: {
        userId: data.userId,
        jobDescription: data.jobDescription,
        jobMetadata: data.jobMetadata as never,
        resume: data.resume as never,
        templateId: data.templateId || null,
        templateCustomization: data.templateCustomization as never,
        pdfUrl: data.pdfUrl || null,
        coverLetter: data.coverLetter || null,
        metadata: data.metadata as never
      }
    });
  }

  /**
   * Find all resumes for a user
   */
  async findByUserId(userId: string): Promise<GeneratedResume[]> {
    return this.db.generatedResume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find a resume by ID
   */
  async findById(id: string): Promise<GeneratedResume | null> {
    return this.db.generatedResume.findUnique({
      where: { id }
    });
  }

  /**
   * Find a resume by ID and ensure it belongs to the user
   */
  async findByIdAndUserId(id: string, userId: string): Promise<GeneratedResume | null> {
    return this.db.generatedResume.findFirst({
      where: { id, userId }
    });
  }

  /**
   * Update resume content
   */
  async update(
    id: string,
    resume: Resume
  ): Promise<GeneratedResume> {
    return this.db.generatedResume.update({
      where: { id },
      data: {
        resume: resume as never,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update template and customization
   */
  async updateTemplate(
    id: string,
    templateId?: string,
    templateCustomization?: Record<string, unknown>
  ): Promise<GeneratedResume> {
    return this.db.generatedResume.update({
      where: { id },
      data: {
        templateId: templateId || null,
        templateCustomization: templateCustomization as never,
        pdfUrl: null,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update PDF URL
   */
  async updatePdfUrl(id: string, pdfUrl: string): Promise<GeneratedResume> {
    return this.db.generatedResume.update({
      where: { id },
      data: {
        pdfUrl,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Delete a resume
   */
  async delete(id: string): Promise<void> {
    await this.db.generatedResume.delete({
      where: { id }
    });
  }

  /**
   * Count resumes for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.db.generatedResume.count({
      where: { userId }
    });
  }
}

// Export singleton instance
export const generatedResumeRepository = new GeneratedResumeRepository();
