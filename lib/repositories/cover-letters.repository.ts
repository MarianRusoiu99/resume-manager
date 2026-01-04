/**
 * Cover Letter Repository
 *
 * Implements ICoverLetterRepository for data access abstraction.
 * Data access layer for cover letters with CRUD operations.
 */

import { prisma } from '@/lib/db/index';
import { Prisma, PrismaClient } from '@prisma/client';

import { GenericUserOwnedRepository, PrismaArgs } from './generic.repository';
import type { CreateCoverLetterInput, ICoverLetterRepository, UpdateCoverLetterInput, CoverLetterData, FindCoverLettersOptions } from './interfaces/cover-letters.repository.interface';

/**
 * Cover Letter Repository Implementation
 */
export class CoverLetterRepository
  extends GenericUserOwnedRepository<CoverLetterData, CreateCoverLetterInput, UpdateCoverLetterInput>
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
    args?: PrismaArgs & { limit?: number; offset?: number }
  ): Promise<CoverLetterData[]> {
    const { where, orderBy, take, skip, include, select, limit, offset } = args || {};
    
    // Apply default limit if not specified
    const effectiveLimit = limit ?? take ?? 100;
    const effectiveOffset = offset ?? skip ?? 0;
    
    return this.db.coverLetter.findMany({
      where: { ...where, userId },
      orderBy: orderBy || { createdAt: 'desc' },
      take: effectiveLimit,
      skip: effectiveOffset,
      ...(include && { include }),
      ...(select && { select }),
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
