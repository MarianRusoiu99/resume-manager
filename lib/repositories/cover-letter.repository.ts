/**
 * Cover Letter Repository
 *
 * Implements ICoverLetterRepository for data access abstraction.
 * Data access layer for cover letters with CRUD operations.
 */

import { prisma } from '@/lib/db';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaUserOwnedCrudRepository } from './base.repository';
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

type CoverLetterEntity = Prisma.CoverLetterGetPayload<object>;

/**
 * Cover Letter Repository Implementation
 */
export class CoverLetterRepository
  extends PrismaUserOwnedCrudRepository<CoverLetterEntity, CreateCoverLetterInput, UpdateCoverLetterInput>
  implements ICoverLetterRepository
{
  protected readonly model = 'coverLetter' as const;

  constructor(dbClient: PrismaClient = prisma) {
    super(dbClient);
  }

  protected override buildCreateData(input: CreateCoverLetterInput): Record<string, unknown> {
    return {
      userId: input.userId,
      content: input.content,
      jobDescription: input.jobDescription,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      metadata: input.metadata as Prisma.InputJsonValue,
    };
  }

  protected override buildUpdateData(input: UpdateCoverLetterInput): Record<string, unknown> {
    return {
      ...(input.content !== undefined && { content: input.content }),
      ...(input.jobDescription !== undefined && { jobDescription: input.jobDescription }),
      ...(input.jobTitle !== undefined && { jobTitle: input.jobTitle }),
      ...(input.companyName !== undefined && { companyName: input.companyName }),
      ...(input.metadata !== undefined && { metadata: input.metadata }),
      updatedAt: new Date(),
    };
  }

  /**
   * Find cover letter by ID
   */
  override async findById(
    id: string,
    userId: string
  ): Promise<
    Prisma.CoverLetterGetPayload<{
      include: { generatedResume: { select: { id: true; jobDescription: true } } };
    }> | null
  > {
    return this.db.coverLetter.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        generatedResume: {
          select: {
            id: true,
            jobDescription: true,
          },
        },
      },
    });
  }

  /**
   * Find all cover letters for a user
   */
  async update(id: string, userId: string, data: UpdateCoverLetterInput): Promise<CoverLetterEntity> {
    const updated = await super.update(id, userId, data);
    if (!updated) {
      throw new Error('Cover letter not found');
    }

    return updated;
  }

  async delete(id: string, userId: string): Promise<CoverLetterEntity> {
    const deleted = await super.delete(id, userId);
    if (!deleted) {
      throw new Error('Cover letter not found');
    }

    return deleted;
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
  ): Promise<{ coverLetters: CoverLetterEntity[]; total: number }> {
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
}

// Singleton instance
export const coverLetterRepository = new CoverLetterRepository();
