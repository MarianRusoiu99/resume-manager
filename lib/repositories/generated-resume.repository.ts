import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/index';
import type { Resume as JsonResume } from '@/lib/validations/jsonresume';
import { GenericUserOwnedRepository } from './generic.repository';
import type { IGeneratedResumeRepository, GeneratedResumeData, CreateResumeInput } from './interfaces/generated-resume.repository.interface';

/**
 * Repository for managing generated resumes in the database.
 *
 * NOTE: The underlying schema migrated from `GeneratedResume` to a hybrid model:
 * - `Resume` (entity) + `ResumeDocument` (JSON Resume content)
 * - `JobPosting`/`Company` for job targeting
 *
 * This repository is kept as a compatibility layer for existing services.
 */
export class GeneratedResumeRepository 
  extends GenericUserOwnedRepository<GeneratedResumeData, CreateResumeInput, any, any>
  implements IGeneratedResumeRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('resume', dbClient);
  }


  private mapResumeToGeneratedData(resume: Prisma.ResumeGetPayload<{
    include: {
      document: { select: { document: true } };
      jobPosting: { include: { company: true } };
      coverLetter: { select: { id: true } };
    };
  }>) {
    const metadata = resume.metadata as unknown;
    const metadataRecord =
      metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : undefined;

    const jobMetadataFromMetadata = metadataRecord?.jobMetadata;

    const jobMetadata =
      jobMetadataFromMetadata ??
      ({
        jobTitle: resume.jobPosting?.title ?? null,
        companyName: resume.jobPosting?.company?.name ?? null,
      } satisfies Record<string, unknown>);

    return {
      id: resume.id,
      userId: resume.userId,
      jobDescription: resume.jobPosting?.description ?? '',
      jobMetadata,
      resume: resume.document?.document ?? null,
      templateId: resume.templateId ?? null,
      coverLetterId: resume.coverLetter?.id ?? null,
      metadata: resume.metadata as unknown,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  }

  private async findOrCreateCompanyId(companyName?: string) {
    const normalized = companyName?.trim();
    if (!normalized) return null;

    const existing = await this.db.company.findFirst({ where: { name: normalized } });
    if (existing) return existing.id;

    const created = await this.db.company.create({
      data: { name: normalized },
      select: { id: true },
    });

    return created.id;
  }

  /**
   * Create a new generated resume (compat layer)
   */
  async create(data: {
    userId: string;
    jobDescription: string;
    jobMetadata?: Record<string, unknown>;
    resume: JsonResume;
    templateId?: string;
    metadata: Record<string, unknown>;
  }) {
    const companyName =
      typeof data.jobMetadata?.companyName === 'string' ? data.jobMetadata.companyName : undefined;
    const jobTitle = typeof data.jobMetadata?.jobTitle === 'string' ? data.jobMetadata.jobTitle : null;

    const companyId = await this.findOrCreateCompanyId(companyName);

    const jobPosting = await this.db.jobPosting.create({
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

    const created = await this.db.resume.create({
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

    return this.mapResumeToGeneratedData(created);
  }

  /**
   * Find all resumes for a user
   */
  override async findAllForUser(userId: string, args?: any): Promise<GeneratedResumeData[]> {
    const resumes = await this.db.resume.findMany({
      ...args,
      where: { ...args?.where, userId },
      orderBy: args?.orderBy || { createdAt: 'desc' },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return resumes.map((resume) => this.mapResumeToGeneratedData(resume as any));
  }

  /**
   * Find all resumes for a user (compat)
   */
  async findByUserId(userId: string): Promise<GeneratedResumeData[]> {
    return this.findAllForUser(userId);
  }

  /**
   * Find a resume by ID
   */
  override async findById(id: string, userId?: string): Promise<GeneratedResumeData | null> {
    const resume = await this.db.resume.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return resume ? this.mapResumeToGeneratedData(resume as any) : null;
  }

  /**
   * Find a resume by ID and ensure it belongs to the user (compat)
   */
  async findByIdAndUserId(id: string, userId: string): Promise<GeneratedResumeData | null> {
    return this.findById(id, userId);
  }

  /**
   * Update resume content
   */
  override async update(id: string, data: any, userId?: string): Promise<GeneratedResumeData> {
    // If data is just a resume (compat)
    const resume = data.resume || data;
    
    const updated = await this.db.resume.update({
      where: { id, ...(userId ? { userId } : {}) },
      data: {
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
        updatedAt: new Date(),
      },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return this.mapResumeToGeneratedData(updated as any);
  }

  /**
   * Delete a resume
   */
  override async delete(id: string, userId?: string): Promise<GeneratedResumeData> {
    const resume = await this.findById(id, userId);
    if (!resume) throw new Error('Resume not found');

    await this.db.resume.delete({ where: { id, ...(userId ? { userId } : {}) } });
    return resume;
  }

  /**
   * Count resumes for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.db.resume.count({ where: { userId } });
  }

  /**
   * Update resume template
   */
  async updateTemplate(id: string, templateId?: string): Promise<GeneratedResumeData> {
    const updated = await this.db.resume.update({
      where: { id },
      data: { templateId: templateId || null },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });
    return this.mapResumeToGeneratedData(updated as any);
  }

  /**
   * Update job details
   */
  async updateJobDetails(
    id: string,
    data: { jobDescription?: string; jobMetadata?: Record<string, unknown> }
  ): Promise<GeneratedResumeData> {
    const resume = await this.db.resume.findUnique({
      where: { id },
      select: { jobPostingId: true, metadata: true },
    });

    if (!resume) throw new Error('Resume not found');

    if (data.jobDescription !== undefined && resume.jobPostingId) {
      await this.db.jobPosting.update({
        where: { id: resume.jobPostingId },
        data: { description: data.jobDescription },
      });
    }

    const currentMetadata = (resume.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      ...(data.jobMetadata ? { jobMetadata: data.jobMetadata } : {}),
    };

    const updated = await this.db.resume.update({
      where: { id },
      data: { metadata: updatedMetadata as Prisma.InputJsonValue },
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return this.mapResumeToGeneratedData(updated as any);
  }

  /**
   * Link a cover letter to a resume
   */
  async linkCoverLetter(id: string, coverLetterId: string | null): Promise<GeneratedResumeData> {
    const updated = await this.db.resume.update({
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
    return this.mapResumeToGeneratedData(updated as any);
  }
}

// Export singleton instance
export const generatedResumeRepository = new GeneratedResumeRepository();
