import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '@/lib/test/mock-prisma';
import { createMockResume, createMockResumes } from '@/lib/test/test-factories';
import { GeneratedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import { RecordNotFoundError } from '@/lib/errors/database';
import type { Resume } from '@/lib/validations/jsonresume';
import type { ResumeWithIncludes } from '@/lib/repositories/generated-resumes/mappers/resume.mapper';

vi.mock('@/lib/db/index', () => ({
  prisma: prismaMock,
}));

describe('GeneratedResumeRepository', () => {
  let repository: GeneratedResumeRepository;

    const createMockResumeWithIncludes = (overrides?: { id?: string; templateId?: string | null; coverLetterId?: string | null }) => ({
    id: overrides?.id ?? 'resume-1',
    userId: 'user-123',
    profileId: null,
    jobPostingId: 'job-1',
    templateId: overrides?.templateId ?? null,
    metadata: { jobMetadata: { jobTitle: 'Software Engineer', companyName: 'Test Company' } },
    createdAt: new Date(),
    updatedAt: new Date(),
    document: {
      id: 'doc-1',
      resumeId: overrides?.id ?? 'resume-1',
      document: { basics: { name: 'John Doe' } } as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    jobPosting: {
      id: 'job-1',
      userId: 'user-123',
      companyId: 'company-1',
      title: 'Software Engineer',
      description: 'Test Job Description',
      sourceUrl: null,
      postedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      company: {
        id: 'company-1',
        name: 'Test Company',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    coverLetter: overrides?.coverLetterId ? { id: overrides.coverLetterId } : null,
  }) as unknown as ResumeWithIncludes;

  beforeEach(() => {
    resetPrismaMock();
    repository = new GeneratedResumeRepository(prismaMock);
  });

  describe('create', () => {
    it('should create a new resume with company and job posting', async () => {
      const resumeData = {
        userId: 'user-123',
        jobDescription: 'Test Job Description',
        jobMetadata: { companyName: 'Test Company', jobTitle: 'Software Engineer' },
        resume: { basics: { name: 'John Doe', email: 'john@example.com' } } as Resume,
        metadata: {},
      };

      prismaMock.company.findFirst.mockResolvedValue(null);
      prismaMock.company.create.mockResolvedValue({
        id: 'company-1',
        name: 'Test Company',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.jobPosting.create.mockResolvedValue({
        id: 'job-1',
        userId: 'user-123',
        companyId: 'company-1',
        title: 'Software Engineer',
        description: 'Test Job Description',
        sourceUrl: null,
        postedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.resume.create.mockResolvedValue(createMockResumeWithIncludes() as any);
      prismaMock.resume.create.mockResolvedValue(createMockResumeWithIncludes());

      const result = await repository.create(resumeData);

      expect(prismaMock.company.findFirst).toHaveBeenCalledWith({ where: { name: 'Test Company' } });
      expect(prismaMock.company.create).toHaveBeenCalled();
      expect(prismaMock.jobPosting.create).toHaveBeenCalled();
      expect(prismaMock.resume.create).toHaveBeenCalled();
      expect(result.userId).toBe('user-123');
    });

    it('should reuse existing company when found', async () => {
      const resumeData = {
        userId: 'user-123',
        jobDescription: 'Test Job Description',
        jobMetadata: { companyName: 'Existing Company', jobTitle: 'Software Engineer' },
        resume: { basics: { name: 'John Doe' } } as Resume,
        metadata: {},
      };

      prismaMock.company.findFirst.mockResolvedValue({
        id: 'existing-company-1',
        name: 'Existing Company',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.jobPosting.create.mockResolvedValue({
        id: 'job-1',
        userId: 'user-123',
        companyId: 'existing-company-1',
        title: 'Software Engineer',
        description: 'Test Job Description',
        sourceUrl: null,
        postedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.resume.create.mockResolvedValue(createMockResumeWithIncludes() as any);
      prismaMock.resume.create.mockResolvedValue(createMockResumeWithIncludes());

      await repository.create(resumeData);

      expect(prismaMock.company.create).not.toHaveBeenCalled();
      expect(prismaMock.company.findFirst).toHaveBeenCalledWith({ where: { name: 'Existing Company' } });
    });

    it('should handle company name in metadata', async () => {
      const resumeData = {
        userId: 'user-123',
        jobDescription: 'Test Job',
        jobMetadata: { companyName: ' Metadata Company ' },
        resume: { basics: { name: 'Jane Doe' } } as Resume,
        metadata: {},
      };

      prismaMock.company.findFirst.mockResolvedValue(null);
      prismaMock.company.create.mockResolvedValue({
        id: 'company-2',
        name: ' Metadata Company '.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.jobPosting.create.mockResolvedValue({
        id: 'job-2',
        userId: 'user-123',
        companyId: 'company-2',
        title: null,
        description: 'Test Job',
        sourceUrl: null,
        postedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.resume.create.mockResolvedValue(createMockResumeWithIncludes({ id: 'resume-2' }));

      await repository.create(resumeData);

      expect(prismaMock.company.create).toHaveBeenCalledWith({ 
        data: { name: ' Metadata Company '.trim() },
        select: { id: true },
      });
    });

    it('should handle null company name', async () => {
      const resumeData = {
        userId: 'user-123',
        jobDescription: 'Test Job',
        resume: { basics: { name: 'Jane Doe' } } as Resume,
        metadata: {},
      };

      prismaMock.company.findFirst.mockResolvedValue(null);
      prismaMock.jobPosting.create.mockResolvedValue({
        id: 'job-1',
        userId: 'user-123',
        companyId: null,
        title: null,
        description: 'Test Job',
        sourceUrl: null,
        postedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.resume.create.mockResolvedValue({
        ...createMockResumeWithIncludes({ id: 'resume-2' }),
        jobPosting: {
          id: 'job-1',
          userId: 'user-123',
          companyId: null,
          title: null,
          description: 'Test Job',
          sourceUrl: null,
          postedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          company: null,
        },
      } as any);

      const result = await repository.create(resumeData);

      expect(prismaMock.company.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.jobPosting.create).toHaveBeenCalledWith({
        data: expect.not.objectContaining({ companyId: expect.anything() }),
        select: { id: true },
      });
    });
  });

  describe('findAllForUser', () => {
    it('should return all resumes for a user', async () => {
      prismaMock.resume.findMany.mockResolvedValue([
        createMockResumeWithIncludes(),
        createMockResumeWithIncludes({ id: 'resume-2' }),
        createMockResumeWithIncludes({ id: 'resume-3' }),
      ] as any);
      prismaMock.resume.findMany.mockResolvedValue([
        createMockResumeWithIncludes(),
        createMockResumeWithIncludes({ id: 'resume-2' }),
        createMockResumeWithIncludes({ id: 'resume-3' }),
      ]);

      const result = await repository.findAllForUser('user-123');

      expect(result).toHaveLength(3);
      expect(prismaMock.resume.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        skip: 0,
        include: {
          document: { select: { document: true } },
          jobPosting: { include: { company: true } },
          coverLetter: { select: { id: true } },
        },
      });
    });

    it('should apply limit and offset when provided', async () => {
      prismaMock.resume.findMany.mockResolvedValue([]);

      await repository.findAllForUser('user-123', { limit: 10, offset: 20 });

      expect(prismaMock.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should use take and skip from args as aliases', async () => {
      prismaMock.resume.findMany.mockResolvedValue([]);

      await repository.findAllForUser('user-123', { take: 5, skip: 15 });

      expect(prismaMock.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 15,
        })
      );
    });

    it('should apply where and orderBy when provided', async () => {
      prismaMock.resume.findMany.mockResolvedValue([]);

      await repository.findAllForUser('user-123', { where: { templateId: 'modern' }, orderBy: { updatedAt: 'asc' } });

      expect(prismaMock.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { templateId: 'modern', userId: 'user-123' },
          orderBy: { updatedAt: 'asc' },
        })
      );
    });
  });

  describe('findByUserId', () => {
    it('should delegate to findAllForUser', async () => {
      prismaMock.resume.findMany.mockResolvedValue([]);

      await repository.findByUserId('user-123');

      expect(prismaMock.resume.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return resume when found', async () => {
      prismaMock.resume.findFirst.mockResolvedValue(createMockResumeWithIncludes());

      const result = await repository.findById('resume-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('resume-1');
      expect(prismaMock.resume.findFirst).toHaveBeenCalledWith({
        where: { id: 'resume-123', userId: 'user-123' },
        include: {
          document: { select: { document: true } },
          jobPosting: { include: { company: true } },
          coverLetter: { select: { id: true } },
        },
      });
    });

    it('should return null when not found', async () => {
      prismaMock.resume.findFirst.mockResolvedValue(null);

      const result = await repository.findById('invalid-id', 'user-123');

      expect(result).toBeNull();
    });

    it('should find without userId filter when not provided', async () => {
      prismaMock.resume.findFirst.mockResolvedValue(createMockResumeWithIncludes());

      await repository.findById('resume-123');

      expect(prismaMock.resume.findFirst).toHaveBeenCalledWith({
        where: { id: 'resume-123' },
        include: {
          document: { select: { document: true } },
          jobPosting: { include: { company: true } },
          coverLetter: { select: { id: true } },
        },
      });
    });
  });

  describe('findByIdAndUserId', () => {
    it('should delegate to findFirst with userId', async () => {
      prismaMock.resume.findFirst.mockResolvedValue(null);

      await repository.findById('resume-123', 'user-123');

      expect(prismaMock.resume.findFirst).toHaveBeenCalledWith({
        where: { id: 'resume-123', userId: 'user-123' },
        include: {
          document: { select: { document: true } },
          jobPosting: { include: { company: true } },
          coverLetter: { select: { id: true } },
        },
      });
    });
  });

  describe('update', () => {
    it('should update resume content', async () => {
      const newResume = { basics: { name: 'Updated Name' } } as Resume;

      prismaMock.resume.update.mockResolvedValue(createMockResumeWithIncludes());

      const result = await repository.update('resume-123', { resume: newResume }, 'user-123');

      expect(prismaMock.resume.update).toHaveBeenCalledWith({
        where: { id: 'resume-123', userId: 'user-123' },
        data: {
          document: {
            upsert: {
              create: { document: newResume },
              update: { document: newResume, updatedAt: expect.any(Date) },
            },
          },
          updatedAt: expect.any(Date),
        },
        include: {
          document: { select: { document: true } },
          jobPosting: { include: { company: true } },
          coverLetter: { select: { id: true } },
        },
      });
    });

    it('should update without userId filter when not provided', async () => {
      const newResume = { basics: { name: 'Updated Name' } } as Resume;

      prismaMock.resume.update.mockResolvedValue(createMockResumeWithIncludes());

      await repository.update('resume-123', { resume: newResume });

      expect(prismaMock.resume.update).toHaveBeenCalledWith({
        where: { id: 'resume-123' },
        data: {
          document: {
            upsert: {
              create: { document: newResume },
              update: { document: newResume, updatedAt: expect.any(Date) },
            },
          },
          updatedAt: expect.any(Date),
        },
        include: {
          document: { select: { document: true } },
          jobPosting: { include: { company: true } },
          coverLetter: { select: { id: true } },
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete and return the resume', async () => {
      prismaMock.resume.findFirst.mockResolvedValue(createMockResumeWithIncludes());
      prismaMock.resume.delete.mockResolvedValue({ id: 'resume-1' } as any);
      prismaMock.resume.delete.mockResolvedValue(createMockResumeWithIncludes({ id: 'resume-1' }));

      const result = await repository.delete('resume-123', 'user-123');

      expect(result.id).toBe('resume-1');
      expect(prismaMock.resume.delete).toHaveBeenCalledWith({
        where: { id: 'resume-123', userId: 'user-123' },
      });
    });

    it('should throw RecordNotFoundError when resume not found', async () => {
      prismaMock.resume.findFirst.mockResolvedValue(null);

      await expect(repository.delete('invalid-id', 'user-123')).rejects.toThrow(RecordNotFoundError);
    });
  });

  describe('countByUserId', () => {
    it('should return count of resumes for user', async () => {
      prismaMock.resume.count.mockResolvedValue(5);

      const count = await repository.countByUserId('user-123');

      expect(count).toBe(5);
      expect(prismaMock.resume.count).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
    });
  });

  describe('updateTemplate', () => {
    it('should update resume template for the owner user', async () => {
      prismaMock.resume.findFirst.mockResolvedValue(createMockResumeWithIncludes());
      prismaMock.resume.update.mockResolvedValue(createMockResumeWithIncludes({ templateId: 'modern' }));

      const result = await repository.updateTemplate('resume-123', 'user-123', 'modern');

      expect(prismaMock.resume.findFirst).toHaveBeenCalledWith({
        where: { id: 'resume-123', userId: 'user-123' },
        include: {
          document: { select: { document: true } },
          jobPosting: { include: { company: true } },
          coverLetter: { select: { id: true } },
        },
      });
      expect(prismaMock.resume.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'resume-123', userId: 'user-123' },
        data: expect.objectContaining({ templateId: 'modern' }),
      }));
    });

    it('should throw RecordNotFoundError when resume does not belong to user (cross-user attempt)', async () => {
      prismaMock.resume.findFirst.mockResolvedValue(null);

      await expect(
        repository.updateTemplate('resume-123', 'wrong-user-id', 'modern')
      ).rejects.toThrow(RecordNotFoundError);
    });

    it('should set templateId to null when undefined provided', async () => {
      prismaMock.resume.findFirst.mockResolvedValue(createMockResumeWithIncludes());
      prismaMock.resume.update.mockResolvedValue(createMockResumeWithIncludes({ templateId: null }));

      await repository.updateTemplate('resume-123', 'user-123', undefined);

      expect(prismaMock.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ templateId: null }),
        })
      );
    });
  });

  describe('updateJobDetails', () => {
    it('should update job description', async () => {
      prismaMock.resume.findUnique.mockResolvedValue({
        id: 'resume-123',
        jobPostingId: 'job-1',
        userId: 'user-123',
        profileId: null,
        templateId: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.resume.findUnique.mockResolvedValue({
        id: 'resume-123',
        jobPostingId: 'job-1',
        userId: 'user-123',
        profileId: null,
        templateId: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ResumeWithIncludes);
      prismaMock.jobPosting.update.mockResolvedValue({ id: 'job-1' } as any);
      prismaMock.resume.update.mockResolvedValue(createMockResumeWithIncludes());

      const result = await repository.updateJobDetails('resume-123', {
        jobDescription: 'Updated Job Description',
      });

      expect(prismaMock.jobPosting.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { description: 'Updated Job Description' },
      });
    });

    it('should update job metadata', async () => {
      const currentMetadata = {
        existingField: 'value',
        jobMetadata: { jobTitle: 'Old Title', companyName: 'Old Company' },
      };

      prismaMock.resume.findUnique.mockResolvedValue({
        id: 'resume-123',
        jobPostingId: 'job-1',
        metadata: currentMetadata,
        userId: 'user-123',
        profileId: null,
        templateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.resume.update.mockResolvedValue(createMockResumeWithIncludes());

      const result = await repository.updateJobDetails('resume-123', {
        jobMetadata: { jobTitle: 'Updated Title' },
      });

      expect(prismaMock.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            metadata: {
              existingField: 'value',
              jobMetadata: { jobTitle: 'Updated Title' },
            },
          },
        })
      );
    });

    it('should throw RecordNotFoundError when resume not found', async () => {
      prismaMock.resume.findUnique.mockResolvedValue(null);

      await expect(repository.updateJobDetails('invalid-id', { jobDescription: 'test' }))
        .rejects.toThrow(RecordNotFoundError);
    });

    it('should merge job metadata with existing metadata', async () => {
      const currentMetadata = {
        customField: 'customValue',
        jobMetadata: { jobTitle: 'Old Title', companyName: 'Old Company' },
      };

      prismaMock.resume.findUnique.mockResolvedValue({
        id: 'resume-123',
        jobPostingId: 'job-1',
        metadata: currentMetadata,
        userId: 'user-123',
        profileId: null,
        templateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prismaMock.resume.update.mockResolvedValue(createMockResumeWithIncludes());

      await repository.updateJobDetails('resume-123', {
        jobMetadata: { jobTitle: 'New Title', companyName: 'New Company' },
      });

      const callArgs = prismaMock.resume.update.mock.calls[0];
      expect(callArgs[0].data.metadata).toEqual({
        customField: 'customValue',
        jobMetadata: { jobTitle: 'New Title', companyName: 'New Company' },
      });
    });
  });

  describe('linkCoverLetter', () => {
    it('should link cover letter to resume', async () => {
      prismaMock.resume.update.mockResolvedValue(
        createMockResumeWithIncludes({ coverLetterId: 'cover-letter-123' })
      );

      const result = await repository.linkCoverLetter('resume-123', 'cover-letter-123');

      expect(prismaMock.resume.update).toHaveBeenCalledWith({
        where: { id: 'resume-123' },
        data: {
          coverLetter: { connect: { id: 'cover-letter-123' } },
        },
        include: {
          document: { select: { document: true } },
          jobPosting: { include: { company: true } },
          coverLetter: { select: { id: true } },
        },
      });
    });

    it('should unlink cover letter when null is provided', async () => {
      prismaMock.resume.update.mockResolvedValue(
        createMockResumeWithIncludes({ coverLetterId: null })
      );

      const result = await repository.linkCoverLetter('resume-123', null);

      expect(prismaMock.resume.update).toHaveBeenCalledWith({
        where: { id: 'resume-123' },
        data: {
          coverLetter: { disconnect: true },
        },
        include: {
          document: { select: { document: true } },
          jobPosting: { include: { company: true } },
          coverLetter: { select: { id: true } },
        },
      });
    });
  });
});
