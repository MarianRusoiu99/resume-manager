import { PrismaClient, GeneratedResume, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Repository for managing generated resumes in the database
 */
export class GeneratedResumeRepository {
  private readonly db: PrismaClient;

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
  // coverLetter removed (dropped from schema)
    metadata: Record<string, unknown>;
  }): Promise<GeneratedResume> {
    return this.db.generatedResume.create({
      data: {
        user: {
          connect: { id: data.userId }
        },
        jobDescription: data.jobDescription,
        jobMetadata: data.jobMetadata as Prisma.InputJsonValue,
        resume: data.resume as Prisma.InputJsonValue,
        template: data.templateId ? {
          connect: { id: data.templateId }
        } : undefined,
        metadata: data.metadata as Prisma.InputJsonValue
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
        resume: resume as Prisma.InputJsonValue,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update template and customization
   */
  async updateTemplate(
    id: string,
    templateId?: string
  ): Promise<GeneratedResume> {
    return this.db.generatedResume.update({
      where: { id },
      data: {
        template: templateId ? {
          connect: { id: templateId }
        } : {
          disconnect: true
        },
        updatedAt: new Date()
      }
    });
  }

  /**
   * Link a cover letter to a resume
   */
  async linkCoverLetter(
    resumeId: string,
    coverLetterId: string
  ): Promise<GeneratedResume> {
    return this.db.generatedResume.update({
      where: { id: resumeId },
      data: {
        coverLetterId,
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
