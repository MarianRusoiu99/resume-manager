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
  // contentJson removed (dropped from schema)
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
    // resumeId removed (dropped from schema)
  metadata: {
    model?: string;
    tokens?: number;
    generationTime?: number;
    personalInstructions?: string;
  };
}

export interface UpdateCoverLetterInput {
  content?: string;
  // contentJson removed (dropped from schema)
  jobDescription?: string;
  jobTitle?: string;
  companyName?: string;
    // resumeId removed (dropped from schema)
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
  // contentJson removed
        jobDescription: data.jobDescription,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
          // resumeId removed
        metadata: data.metadata as Prisma.InputJsonValue,
      },
        // resume relation removed
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
        // resume relation removed
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
          // resume relation removed
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip: offset,
      }),
      prisma.coverLetter.count({ where: { userId } }),
    ]);

    return { coverLetters, total };
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
        // contentJson removed
        ...(data.jobDescription !== undefined && { jobDescription: data.jobDescription }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        // resumeId removed
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        updatedAt: new Date(),
      },
      // resume relation removed
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
