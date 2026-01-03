import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/index';
import type { Resume as JsonResume } from '@/lib/validations/jsonresume';
import { GenericUserOwnedRepository, PrismaArgs } from './generic.repository';
import type { IGeneratedResumeRepository, GeneratedResumeData, CreateResumeInput, UpdateResumeInput } from './interfaces/generated-resumes.repository.interface';
import { mapResumeToGeneratedData, ResumeWithIncludes } from './generated-resumes/mappers/resume.mapper';

// Prisma delegate type for Resume model - simplified for generic repository compatibility
type ResumePrismaDelegate = {
  findUnique(args: { where: Record<string, unknown>; include?: unknown; select?: unknown }): Promise<unknown>;
  findFirst(args: { where: Record<string, unknown>; include?: unknown; select?: unknown; orderBy?: unknown }): Promise<unknown>;
  findMany(args?: PrismaArgs): Promise<unknown[]>;
  create(args: { data: CreateResumeInput; include?: unknown; select?: unknown }): Promise<unknown>;
  update(args: { where: Record<string, unknown>; data: UpdateResumeInput; include?: unknown; select?: unknown }): Promise<unknown>;
  delete(args: { where: Record<string, unknown>; include?: unknown; select?: unknown }): Promise<unknown>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
};

/**
 * Repository for managing generated resumes in the database.
 */
export class GeneratedResumeRepository 
  extends GenericUserOwnedRepository<GeneratedResumeData, CreateResumeInput, UpdateResumeInput, ResumePrismaDelegate>
  implements IGeneratedResumeRepository 
{
  constructor(dbClient: PrismaClient = prisma) {
    super('resume', dbClient);
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

    return mapResumeToGeneratedData(created as ResumeWithIncludes);
  }

  /**
   * Find all resumes for a user
   */
  override async findAllForUser(userId: string, args?: PrismaArgs): Promise<GeneratedResumeData[]> {
    const { where, orderBy, take, skip } = args || {};
    const resumes = await this.db.resume.findMany({
      where: { ...where, userId },
      orderBy: orderBy || { createdAt: 'desc' },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
      include: {
        document: { select: { document: true } },
        jobPosting: { include: { company: true } },
        coverLetter: { select: { id: true } },
      },
    });

    return resumes.map((resume) => mapResumeToGeneratedData(resume as ResumeWithIncludes));
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

    return resume ? mapResumeToGeneratedData(resume as ResumeWithIncludes) : null;
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
  override async update(id: string, data: UpdateResumeInput, userId?: string): Promise<GeneratedResumeData> {
    // If data is just a resume (compat)
    const resume = data.resume;
    
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

    return mapResumeToGeneratedData(updated as ResumeWithIncludes);
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
    return mapResumeToGeneratedData(updated as ResumeWithIncludes);
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

    return mapResumeToGeneratedData(updated as ResumeWithIncludes);
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
    return mapResumeToGeneratedData(updated as ResumeWithIncludes);
  }
}

// Export singleton instance
export const generatedResumeRepository = new GeneratedResumeRepository();
