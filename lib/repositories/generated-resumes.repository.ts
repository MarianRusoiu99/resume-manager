import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/index';
import type { Resume as JsonResume } from '@/lib/validations/jsonresume';
import { GenericUserOwnedRepository, PrismaArgs } from './generic.repository';
import { RecordNotFoundError } from '@/lib/errors/database';
import { TransactionClient } from '@/lib/db/transaction';
import type { IGeneratedResumeRepository, GeneratedResumeEntity, CreateResumeInput, UpdateResumeInput } from './interfaces/generated-resumes.repository.interface';
import { mapResumeToGeneratedData, ResumeWithIncludes } from './generated-resumes/mappers/resume.mapper';

/**
 * Repository for managing generated resumes in the database.
 */
export class GeneratedResumeRepository 
  extends GenericUserOwnedRepository<
    GeneratedResumeEntity, 
    CreateResumeInput, 
    UpdateResumeInput, 
    'resume', 
    Prisma.ResumeDelegate
  >
  implements IGeneratedResumeRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('resume', dbClient);
  }

  private async findOrCreateCompanyId(companyName?: string, tx?: TransactionClient) {
    const normalized = companyName?.trim();
    if (!normalized) return null;

    const client = tx || (this.db as TransactionClient);
    const existing = await client.company.findFirst({ where: { name: normalized } });
    if (existing) return existing.id;

    const created = await client.company.create({
      data: { name: normalized },
      select: { id: true },
    });

    return created.id;
  }

  /**
   * Create a new generated resume
   */
  override async create(data: CreateResumeInput, tx?: TransactionClient): Promise<GeneratedResumeEntity> {
    const companyName =
      typeof data.jobMetadata?.companyName === 'string' ? data.jobMetadata.companyName : undefined;
    const jobTitle = typeof data.jobMetadata?.jobTitle === 'string' ? data.jobMetadata.jobTitle : null;

    const companyId = await this.findOrCreateCompanyId(companyName, tx);

    const client = tx || (this.db as TransactionClient);
    const jobPosting = await client.jobPosting.create({
      data: {
        userId: data.userId,
        description: data.jobDescription,
        title: jobTitle,
        ...(companyId ? { companyId } : {}),
      },
      select: { id: true },
    });

    const resumeMetadata: Record<string, unknown> = {
      ...(data.metadata ?? {}),
      ...(data.jobMetadata ? { jobMetadata: data.jobMetadata } : {}),
    };

    const created = await client.resume.create({
      data: {
        userId: data.userId,
        jobPostingId: jobPosting.id,
        ...(data.templateId ? { templateId: data.templateId } : {}),
        metadata: resumeMetadata as Prisma.InputJsonValue,
        document: {
          create: {
            document: data.resume as Prisma.InputJsonValue,
          },
        },
      },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return mapResumeToGeneratedData(created as ResumeWithIncludes);
  }

  /**
   * Find all resumes for a user
   */
  override async findAllForUser(
    userId: string, 
    args?: PrismaArgs & { limit?: number; offset?: number },
    tx?: TransactionClient
  ): Promise<GeneratedResumeEntity[]> {
    const { where, orderBy, take, skip, limit, offset } = args || {};
    
    // Apply default limit if not specified
    const effectiveLimit = limit ?? take ?? 100;
    const effectiveOffset = offset ?? skip ?? 0;
    
    const resumes = await this.getDelegate(tx).findMany({
      where: { ...where, userId },
      orderBy: (orderBy as Prisma.ResumeOrderByWithRelationInput) || { createdAt: 'desc' },
      take: effectiveLimit,
      skip: effectiveOffset,
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return (resumes as unknown as ResumeWithIncludes[]).map((resume) => mapResumeToGeneratedData(resume));
  }

  /**
   * Find all resumes for a user
   */
  async findByUserId(userId: string, tx?: TransactionClient): Promise<GeneratedResumeEntity[]> {
    return this.findAllForUser(userId, undefined, tx);
  }

  /**
   * Find a resume by ID
   */
  override async findById(id: string, userId?: string, tx?: TransactionClient): Promise<GeneratedResumeEntity | null> {
    const resume = await this.getDelegate(tx).findFirst({
      where: { id, ...(userId ? { userId } : {}) },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return resume ? mapResumeToGeneratedData(resume as unknown as ResumeWithIncludes) : null;
  }

  /**
   * Update resume content
   */
  override async update(id: string, data: UpdateResumeInput, userId?: string, tx?: TransactionClient): Promise<GeneratedResumeEntity> {
    const resume = data.resume;
    
    const updated = await this.getDelegate(tx).update({
      where: { id, ...(userId ? { userId } : {}) },
      data: {
        ...(resume ? {
          document: {
            upsert: {
              create: {
                document: resume as Prisma.InputJsonValue,
              },
              update: {
                document: resume as Prisma.InputJsonValue,
                updatedAt: new Date(),
              },
            },
          },
        } : {}),
        ...(data.templateId !== undefined ? { templateId: data.templateId || null } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata as Prisma.InputJsonValue } : {}),
        updatedAt: new Date(),
      },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return mapResumeToGeneratedData(updated as unknown as ResumeWithIncludes);
  }

  /**
   * Delete a resume
   */
  override async delete(id: string, userId?: string, tx?: TransactionClient): Promise<GeneratedResumeEntity> {
    const resume = await this.findById(id, userId, tx);
    if (!resume) {
      throw new RecordNotFoundError('Resume', id, 'delete');
    }

    await this.getDelegate(tx).delete({ where: { id, ...(userId ? { userId } : {}) } });
    return resume;
  }

  /**
   * Count resumes for a user
   */
  async countByUserId(userId: string, tx?: TransactionClient): Promise<number> {
    return this.count(userId, tx);
  }

  /**
   * Update resume template
   */
  async updateTemplate(id: string, userId: string, templateId?: string, tx?: TransactionClient): Promise<GeneratedResumeEntity> {
    const resume = await this.findById(id, userId, tx);
    if (!resume) {
      throw new RecordNotFoundError('Resume', id, 'updateTemplate');
    }
    return this.update(id, { templateId: templateId || null }, userId, tx);
  }

  /**
   * Update job details
   */
  async updateJobDetails(
    id: string,
    data: { jobDescription?: string; jobMetadata?: Record<string, unknown> },
    tx?: TransactionClient
  ): Promise<GeneratedResumeEntity> {
    const client = tx || (this.db as TransactionClient);
    const resume = await client.resume.findUnique({
      where: { id },
      select: { jobPostingId: true, metadata: true },
    });

    if (!resume) {
      throw new RecordNotFoundError('Resume', id, 'updateJobDetails');
    }

    if (data.jobDescription !== undefined && resume.jobPostingId) {
      await client.jobPosting.update({
        where: { id: resume.jobPostingId },
        data: { description: data.jobDescription },
      });
    }

    const currentMetadata = (resume.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      ...(data.jobMetadata ? { jobMetadata: data.jobMetadata } : {}),
    };

    const updated = await client.resume.update({
      where: { id },
      data: { metadata: updatedMetadata as Prisma.InputJsonValue },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return mapResumeToGeneratedData(updated as unknown as ResumeWithIncludes);
  }

  /**
   * Link a cover letter to a resume
   */
  async linkCoverLetter(id: string, coverLetterId: string | null, tx?: TransactionClient): Promise<GeneratedResumeEntity> {
    const client = tx || (this.db as TransactionClient);
    const updated = await client.resume.update({
      where: { id },
      data: { 
        coverLetter: coverLetterId 
          ? { connect: { id: coverLetterId } } 
          : { disconnect: true } 
      },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });
    return mapResumeToGeneratedData(updated as unknown as ResumeWithIncludes);
  }
}

// Export singleton instance
export const generatedResumeRepository = new GeneratedResumeRepository();
