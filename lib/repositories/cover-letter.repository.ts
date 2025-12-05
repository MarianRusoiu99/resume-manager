/**
 * Cover Letter Repository
 * 
 * Implements ICoverLetterRepository for data access abstraction.
 * Data access layer for cover letters with CRUD operations.
 */

import { prisma } from '@/lib/db';
import { PrismaClient, Prisma } from '@prisma/client';
import type { ICoverLetterRepository } from './interfaces';

export interface CreateCoverLetterInput {
  userId: string;
  content: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  metadata: {
    model?: string;
    tokens?: number;
    generationTime?: number;
    personalInstructions?: string;
  };
}

export interface UpdateCoverLetterInput {
  content?: string;
  jobDescription?: string;
  jobTitle?: string;
  companyName?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Cover Letter Repository Implementation
 */
export class CoverLetterRepository implements ICoverLetterRepository {
  private readonly db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Create a new cover letter
   */
  async create(data: CreateCoverLetterInput) {
    return this.db.coverLetter.create({
      data: {
        userId: data.userId,
        content: data.content,
        jobDescription: data.jobDescription,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Find cover letter by ID
   */
  async findById(id: string, userId: string) {
    return this.db.coverLetter.findFirst({
      where: {
        id,
        userId,
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
      this.db.coverLetter.findMany({
        where: { userId },
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip: offset,
      }),
      this.db.coverLetter.count({ where: { userId } }),
    ]);

    return { coverLetters, total };
  }

  /**
   * Update a cover letter
   */
  async update(id: string, userId: string, data: UpdateCoverLetterInput) {
    return this.db.coverLetter.update({
      where: {
        id,
        userId,
      },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.jobDescription !== undefined && { jobDescription: data.jobDescription }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a cover letter
   */
  async delete(id: string, userId: string) {
    return this.db.coverLetter.delete({
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
    const count = await this.db.coverLetter.count({
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
