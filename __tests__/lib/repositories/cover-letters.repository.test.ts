import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '@/lib/test/mock-prisma';
import { createMockCoverLetter, createMockCoverLetters } from '@/lib/test/test-factories';
import { CoverLetterRepository } from '@/lib/repositories/cover-letters.repository';
import { RecordNotFoundError } from '@/lib/errors/database';
import { Prisma } from '@prisma/client';

type CoverLetterWithIncludes = Prisma.CoverLetterGetPayload<{
  include: {
    resume: {
      select: {
        id: true;
        jobPosting: { select: { description: true } };
      };
    };
    jobPosting: {
      select: {
        description: true;
        title: true;
        company: { select: { name: true } };
      };
    };
  };
}>;

vi.mock('@/lib/db/index', () => ({
  prisma: prismaMock,
}));

describe('CoverLetterRepository', () => {
  let repository: CoverLetterRepository;

  const createMockCoverLetterWithIncludes = (overrides?: { id?: string; resumeId?: string | null; jobPostingId?: string | null }) => ({
    id: overrides?.id ?? 'cover-letter-1',
    userId: 'user-123',
    resumeId: overrides?.resumeId ?? 'resume-123',
    jobPostingId: overrides?.jobPostingId ?? null,
    content: 'Dear Hiring Manager,\n\nI am writing to express my interest in the Software Engineer position...',
    metadata: {
      jobTitle: 'Software Engineer',
      companyName: 'Example Corp',
      jobDescription: 'We are looking for a talented developer to join our team...',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    resume: {
      id: 'resume-123',
      jobPosting: {
        description: 'Test job description',
      },
    },
    jobPosting: {
      id: 'job-1',
      description: 'Test job description',
      title: 'Software Engineer',
      company: {
        id: 'company-1',
        name: 'Test Company',
      },
    },
  } as unknown as CoverLetterWithIncludes);

  beforeEach(() => {
    resetPrismaMock();
    repository = new CoverLetterRepository(prismaMock);
  });

  describe('findById', () => {
    it('should return cover letter when found', async () => {
      prismaMock.coverLetter.findFirst.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      const result = await repository.findById('cover-letter-1', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cover-letter-1');
      expect(prismaMock.coverLetter.findFirst).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1', userId: 'user-123' },
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
      });
    });

    it('should return null when not found', async () => {
      prismaMock.coverLetter.findFirst.mockResolvedValue(null);

      const result = await repository.findById('invalid-id', 'user-123');

      expect(result).toBeNull();
    });

    it('should find without userId filter when not provided', async () => {
      prismaMock.coverLetter.findFirst.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      await repository.findById('cover-letter-1');

      expect(prismaMock.coverLetter.findFirst).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1' },
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
      });
    });
  });

  describe('update', () => {
    it('should update cover letter content', async () => {
      prismaMock.coverLetter.update.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      const result = await repository.update('cover-letter-1', {
        content: 'Updated content',
      }, 'user-123');

      expect(prismaMock.coverLetter.update).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1', userId: 'user-123' },
        data: { content: 'Updated content' },
      });
    });

    it('should update resumeId', async () => {
      prismaMock.coverLetter.update.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      const result = await repository.update('cover-letter-1', {
        resumeId: 'resume-456',
      }, 'user-123');

      expect(prismaMock.coverLetter.update).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1', userId: 'user-123' },
        data: { resumeId: 'resume-456' },
      });
    });

    it('should update jobPostingId', async () => {
      prismaMock.coverLetter.update.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      const result = await repository.update('cover-letter-1', {
        jobPostingId: 'job-456',
      }, 'user-123');

      expect(prismaMock.coverLetter.update).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1', userId: 'user-123' },
        data: { jobPostingId: 'job-456' },
      });
    });

    it('should update metadata', async () => {
      const newMetadata = { jobTitle: 'New Title', companyName: 'New Company' };
      prismaMock.coverLetter.update.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      const result = await repository.update('cover-letter-1', {
        metadata: newMetadata,
      }, 'user-123');

      expect(prismaMock.coverLetter.update).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1', userId: 'user-123' },
        data: { metadata: newMetadata },
      });
    });

    it('should update without userId filter when not provided', async () => {
      prismaMock.coverLetter.update.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      const result = await repository.update('cover-letter-1', {
        content: 'Updated content',
      });

      expect(prismaMock.coverLetter.update).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1' },
        data: { content: 'Updated content' },
      });
    });

    it('should handle undefined values correctly', async () => {
      prismaMock.coverLetter.update.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      const result = await repository.update('cover-letter-1', {
        content: undefined,
        resumeId: 'new-resume-id',
      }, 'user-123');

      expect(prismaMock.coverLetter.update).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1', userId: 'user-123' },
        data: { resumeId: 'new-resume-id' },
      });
    });
  });

  describe('delete', () => {
    it('should delete and return cover letter', async () => {
      prismaMock.coverLetter.delete.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      const result = await repository.delete('cover-letter-1', 'user-123');

      expect(result.id).toBe('cover-letter-1');
      expect(prismaMock.coverLetter.delete).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1', userId: 'user-123' },
      });
    });

    it('should delete without userId filter when not provided', async () => {
      prismaMock.coverLetter.delete.mockResolvedValue(
        createMockCoverLetterWithIncludes()
      );

      const result = await repository.delete('cover-letter-1');

      expect(prismaMock.coverLetter.delete).toHaveBeenCalledWith({
        where: { id: 'cover-letter-1' },
      });
    });
  });

  describe('findAllForUser', () => {
    it('should return all cover letters for a user', async () => {
      prismaMock.coverLetter.findMany.mockResolvedValue([
        createMockCoverLetterWithIncludes(),
        createMockCoverLetterWithIncludes({ id: 'cover-letter-2' }),
        createMockCoverLetterWithIncludes({ id: 'cover-letter-3' }),
      ]);

      const result = await repository.findAllForUser('user-123');

      expect(result).toHaveLength(3);
      expect(prismaMock.coverLetter.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        skip: 0,
      });
    });

    it('should apply limit and offset when provided', async () => {
      prismaMock.coverLetter.findMany.mockResolvedValue([]);

      await repository.findAllForUser('user-123', { limit: 10, offset: 20 });

      expect(prismaMock.coverLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    it('should use take and skip from args as aliases', async () => {
      prismaMock.coverLetter.findMany.mockResolvedValue([]);

      await repository.findAllForUser('user-123', { take: 5, skip: 15 });

      expect(prismaMock.coverLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 15,
        })
      );
    });

    it('should apply where and orderBy when provided', async () => {
      prismaMock.coverLetter.findMany.mockResolvedValue([]);

      await repository.findAllForUser('user-123', {
        where: { resumeId: 'resume-123' },
        orderBy: { updatedAt: 'asc' },
      });

      expect(prismaMock.coverLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resumeId: 'resume-123', userId: 'user-123' },
          orderBy: { updatedAt: 'asc' },
        })
      );
    });

    it('should apply include when provided', async () => {
      prismaMock.coverLetter.findMany.mockResolvedValue([]);

      await repository.findAllForUser('user-123', {
        include: { resume: true },
      });

      expect(prismaMock.coverLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { resume: true },
        })
      );
    });

    it('should apply select when provided', async () => {
      prismaMock.coverLetter.findMany.mockResolvedValue([]);

      await repository.findAllForUser('user-123', {
        select: { id: true, content: true },
      });

      expect(prismaMock.coverLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, content: true },
        })
      );
    });
  });

  describe('findAllForUserWithCount', () => {
    it('should return cover letters and total count', async () => {
      prismaMock.coverLetter.findMany.mockResolvedValue([
        createMockCoverLetterWithIncludes(),
        createMockCoverLetterWithIncludes({ id: 'cover-letter-2' }),
      ]);
      prismaMock.coverLetter.count.mockResolvedValue(5);

      const result = await repository.findAllForUserWithCount('user-123');

      expect(result.coverLetters).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('should use default pagination options', async () => {
      prismaMock.coverLetter.findMany.mockResolvedValue([]);
      prismaMock.coverLetter.count.mockResolvedValue(0);

      await repository.findAllForUserWithCount('user-123');

      expect(prismaMock.coverLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should use custom pagination options', async () => {
      prismaMock.coverLetter.findMany.mockResolvedValue([]);
      prismaMock.coverLetter.count.mockResolvedValue(0);

      await repository.findAllForUserWithCount('user-123', {
        limit: 10,
        offset: 20,
        orderBy: 'updatedAt',
        orderDir: 'asc',
      });

      expect(prismaMock.coverLetter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
          orderBy: { updatedAt: 'asc' },
        })
      );
    });
  });
});
