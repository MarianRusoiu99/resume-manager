/**
 * Cover Letter Repository
 *
 * Implements ICoverLetterRepository for data access abstraction.
 * Data access layer for cover letters with CRUD operations.
 */

import { prisma } from '@/lib/db';
import { Prisma, PrismaClient } from '@prisma/client';

import { GenericUserOwnedRepository } from './generic.repository';
import type { CreateCoverLetterInput, ICoverLetterRepository, UpdateCoverLetterInput, CoverLetterData, FindCoverLettersOptions } from './interfaces/cover-letter.repository.interface';

/**
 * Cover Letter Repository Implementation
 */
export class CoverLetterRepository
  extends GenericUserOwnedRepository<CoverLetterData, CreateCoverLetterInput, UpdateCoverLetterInput, any>
  implements ICoverLetterRepository
{
  constructor(dbClient: PrismaClient = prisma) {
    super('coverLetter', dbClient);
  }

  /**
   * Find cover letter by ID
   */
  override async findById(id: string, userId?: string): Promise<CoverLetterData | null> {
    return this.db.coverLetter.findFirst({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
      include: {
        resume: {
          select: {
            id: true,
            jobPosting: { select: { description: true } },
          },
        },
        jobPosting: {
          select: {
            description: true,
            title: true,
            company: { select: { name: true } },
          },
        },
      },
    }) as Promise<CoverLetterData | null>;
  }

  /**
   * Update a cover letter
   */
  override async update(id: string, data: UpdateCoverLetterInput, userId?: string): Promise<CoverLetterData> {
    const updateData: Prisma.CoverLetterUpdateInput = {
      ...(data.content !== undefined && { content: data.content }),
      ...(data.resumeId !== undefined && { resumeId: data.resumeId }),
      ...(data.jobPostingId !== undefined && { jobPostingId: data.jobPostingId }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
    };

    return this.db.coverLetter.update({
      where: { id, ...(userId ? { userId } : {}) },
      data: updateData,
    }) as Promise<CoverLetterData>;
  }

  override async delete(id: string, userId?: string): Promise<CoverLetterData> {
    return this.db.coverLetter.delete({
      where: { id, ...(userId ? { userId } : {}) },
    }) as Promise<CoverLetterData>;
  }

  /**
   * Find all cover letters for a user
   */
  override async findAllForUser(
    userId: string,
    args?: any
  ): Promise<CoverLetterData[]> {
    return this.db.coverLetter.findMany({
      ...args,
      where: { ...args?.where, userId },
    }) as Promise<CoverLetterData[]>;
  }

  /**
   * Find all cover letters for a user with count
   */
  async findAllForUserWithCount(
    userId: string,
    options?: FindCoverLettersOptions
  ): Promise<{ coverLetters: CoverLetterData[]; total: number }> {
    const { limit = 50, offset = 0, orderBy = 'createdAt', orderDir = 'desc' } = options || {};

    const [coverLetters, total] = await Promise.all([
      this.findAllForUser(userId, {
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip: offset,
      }),
      this.count({ userId }),
    ]);

    return { coverLetters, total };
  }
}

// Singleton instance
export const coverLetterRepository = new CoverLetterRepository();
