/**
 * Cover Letter Repository
 * 
 * Data access layer for cover letters with CRUD operations
 */

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface CreateCoverLetterInput {
  userId: string;
  content: string;
  contentJson?: string; // Yoopta editor JSON state
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  resumeId?: string;
  metadata: {
    model?: string;
    tokens?: number;
    generationTime?: number;
    personalInstructions?: string;
  };
}

export interface UpdateCoverLetterInput {
  content?: string;
  contentJson?: string; // Yoopta editor JSON state
  jobDescription?: string;
  jobTitle?: string;
  companyName?: string;
  resumeId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export class CoverLetterRepository {
  /**
   * Create a new cover letter
   */
  async create(data: CreateCoverLetterInput) {
    return prisma.coverLetter.create({
      data: {
        userId: data.userId,
        content: data.content,
        contentJson: data.contentJson,
        jobDescription: data.jobDescription,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        resumeId: data.resumeId,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
      include: {
        resume: {
          select: {
            id: true,
            jobDescription: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Find cover letter by ID
   */
  async findById(id: string, userId: string) {
    return prisma.coverLetter.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        resume: {
          select: {
            id: true,
            jobDescription: true,
            resume: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Find all cover letters for a user
   */
  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'updatedAt';
      orderDir?: 'asc' | 'desc';
    }
  ) {
    const { limit = 50, offset = 0, orderBy = 'createdAt', orderDir = 'desc' } = options || {};

    const [coverLetters, total] = await Promise.all([
      prisma.coverLetter.findMany({
        where: { userId },
        include: {
          resume: {
            select: {
              id: true,
              jobDescription: true,
              createdAt: true,
            },
          },
        },
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip: offset,
      }),
      prisma.coverLetter.count({ where: { userId } }),
    ]);

    return { coverLetters, total };
  }

  /**
   * Find cover letters by resume ID
   */
  async findByResumeId(resumeId: string, userId: string) {
    return prisma.coverLetter.findMany({
      where: {
        resumeId,
        userId,
      },
      include: {
        resume: {
          select: {
            id: true,
            jobDescription: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a cover letter
   */
  async update(id: string, userId: string, data: UpdateCoverLetterInput) {
    return prisma.coverLetter.update({
      where: {
        id,
        userId,
      },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.contentJson !== undefined && { contentJson: data.contentJson }),
        ...(data.jobDescription !== undefined && { jobDescription: data.jobDescription }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.resumeId !== undefined && { resumeId: data.resumeId }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        updatedAt: new Date(),
      },
      include: {
        resume: {
          select: {
            id: true,
            jobDescription: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Delete a cover letter
   */
  async delete(id: string, userId: string) {
    return prisma.coverLetter.delete({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Check if cover letter exists and belongs to user
   */
  async exists(id: string, userId: string): Promise<boolean> {
    const count = await prisma.coverLetter.count({
      where: {
        id,
        userId,
      },
    });
    return count > 0;
  }
}

// Singleton instance
export const coverLetterRepository = new CoverLetterRepository();
