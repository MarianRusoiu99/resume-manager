import { describe, it, expect, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { CoverLetterRepository } from '@/lib/repositories/cover-letters.repository';
import type { INotificationService } from '@/lib/services/interfaces';
import { createMockCoverLetter, createMockCoverLetters } from '@/__tests__/utils/test-factories';
import { CoverLetterService } from '@/lib/services/cover-letters/cover-letters.service';
import type { CoverLetterData, CreateCoverLetterInput } from '@/lib/repositories/interfaces/cover-letters.repository.interface';

describe('CoverLetterService', () => {
  let service: CoverLetterService;
  let repositoryMock: ReturnType<typeof mockDeep<CoverLetterRepository>>;
  let notificationServiceMock: ReturnType<typeof mockDeep<INotificationService>>;

  beforeEach(() => {
    repositoryMock = mockDeep<CoverLetterRepository>();
    notificationServiceMock = mockDeep<INotificationService>();
    mockReset(repositoryMock);
    mockReset(notificationServiceMock);
    service = new CoverLetterService(repositoryMock, notificationServiceMock);
  });

  describe('CRUD Operations', () => {
    describe('createCoverLetter', () => {
      it('should create a cover letter and send notification', async () => {
        const input: CreateCoverLetterInput = {
          userId: 'user-123',
          content: 'Dear Hiring Manager...',
          resumeId: 'resume-123',
          metadata: {
            jobTitle: 'Software Engineer',
            companyName: 'Tech Corp',
          },
        };
        const createdCoverLetter = createMockCoverLetter({
          id: 'cover-letter-new',
          userId: input.userId,
          content: input.content,
        }) as CoverLetterData;
        repositoryMock.create.mockResolvedValue(createdCoverLetter);
        notificationServiceMock.notifyCoverLetterGenerated.mockResolvedValue({
          success: true,
          data: {} as never,
        });

        const result = await service.createCoverLetter(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe('cover-letter-new');
        }
        expect(repositoryMock.create).toHaveBeenCalledWith(input);
        expect(notificationServiceMock.notifyCoverLetterGenerated).toHaveBeenCalledWith(
          'user-123',
          'cover-letter-new',
          'Software Engineer',
          'Tech Corp'
        );
      });

      it('should not send notification when creation fails', async () => {
        const input: CreateCoverLetterInput = {
          userId: 'user-123',
          content: 'Dear Hiring Manager...',
          metadata: {},
        };
        repositoryMock.create.mockRejectedValue(new Error('Database error'));

        const result = await service.createCoverLetter(input);

        expect(result.success).toBe(false);
        expect(notificationServiceMock.notifyCoverLetterGenerated).not.toHaveBeenCalled();
      });

      it('should still return success if notification fails', async () => {
        const input: CreateCoverLetterInput = {
          userId: 'user-123',
          content: 'Dear Hiring Manager...',
          metadata: { jobTitle: 'Engineer' },
        };
        const createdCoverLetter = createMockCoverLetter({
          id: 'cover-letter-new',
          userId: input.userId,
        }) as CoverLetterData;
        repositoryMock.create.mockResolvedValue(createdCoverLetter);
        notificationServiceMock.notifyCoverLetterGenerated.mockResolvedValue({
          success: false,
          error: 'Notification failed',
          code: 'INTERNAL_ERROR',
        });

        const result = await service.createCoverLetter(input);

        expect(result.success).toBe(true);
      });
    });

    describe('getCoverLetter', () => {
      it('should return cover letter when found', async () => {
        const coverLetter = createMockCoverLetter({
          id: 'cover-letter-123',
          userId: 'user-123',
        }) as CoverLetterData;
        repositoryMock.findByIdForUser.mockResolvedValue(coverLetter);

        const result = await service.getCoverLetter('cover-letter-123', 'user-123');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe('cover-letter-123');
        }
        expect(repositoryMock.findByIdForUser).toHaveBeenCalledWith('cover-letter-123', 'user-123');
      });

      it('should return NOT_FOUND error when cover letter does not exist', async () => {
        repositoryMock.findByIdForUser.mockResolvedValue(null);

        const result = await service.getCoverLetter('invalid-id', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('CoverLetter not found');
          expect(result.code).toBe('NOT_FOUND');
        }
      });

      it('should handle repository errors gracefully', async () => {
        repositoryMock.findByIdForUser.mockRejectedValue(new Error('Database error'));

        const result = await service.getCoverLetter('cover-letter-123', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Database error');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });
    });

    describe('getUserCoverLetters', () => {
      it('should return list of cover letters for a user with count', async () => {
        const coverLetters = createMockCoverLetters(3, 'user-123') as CoverLetterData[];
        repositoryMock.findAllForUserWithCount.mockResolvedValue({
          coverLetters,
          total: 3,
        });

        const result = await service.getUserCoverLetters('user-123');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.coverLetters).toHaveLength(3);
          expect(result.data.total).toBe(3);
        }
        expect(repositoryMock.findAllForUserWithCount).toHaveBeenCalledWith('user-123', undefined);
      });

      it('should pass options to repository', async () => {
        repositoryMock.findAllForUserWithCount.mockResolvedValue({
          coverLetters: [],
          total: 0,
        });

        const options = { limit: 10, offset: 5, orderBy: 'updatedAt' as const, orderDir: 'asc' as const };
        await service.getUserCoverLetters('user-123', options);

        expect(repositoryMock.findAllForUserWithCount).toHaveBeenCalledWith('user-123', options);
      });

      it('should return empty list when user has no cover letters', async () => {
        repositoryMock.findAllForUserWithCount.mockResolvedValue({
          coverLetters: [],
          total: 0,
        });

        const result = await service.getUserCoverLetters('user-123');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.coverLetters).toEqual([]);
          expect(result.data.total).toBe(0);
        }
      });

      it('should handle repository errors gracefully', async () => {
        repositoryMock.findAllForUserWithCount.mockRejectedValue(new Error('Database error'));

        const result = await service.getUserCoverLetters('user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Database error');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });
    });

    describe('updateCoverLetter', () => {
      it('should update cover letter content', async () => {
        const coverLetter = createMockCoverLetter({
          id: 'cover-letter-123',
          userId: 'user-123',
        }) as CoverLetterData;
        const updatedCoverLetter = {
          ...coverLetter,
          content: 'Updated content',
          updatedAt: new Date(),
        };
        repositoryMock.updateForUser.mockResolvedValue(updatedCoverLetter);

        const result = await service.updateCoverLetter('cover-letter-123', 'user-123', {
          content: 'Updated content',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.content).toBe('Updated content');
        }
        expect(repositoryMock.updateForUser).toHaveBeenCalledWith(
          'cover-letter-123',
          'user-123',
          { content: 'Updated content' }
        );
      });

      it('should handle update errors gracefully', async () => {
        repositoryMock.updateForUser.mockRejectedValue(new Error('Update failed'));

        const result = await service.updateCoverLetter('cover-letter-123', 'user-123', {
          content: 'New content',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Update failed');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });

      it('should update metadata', async () => {
        const coverLetter = createMockCoverLetter({
          id: 'cover-letter-123',
          userId: 'user-123',
        }) as CoverLetterData;
        const updatedMetadata = { jobTitle: 'Senior Engineer', companyName: 'New Corp' };
        const updatedCoverLetter = {
          ...coverLetter,
          metadata: updatedMetadata,
          updatedAt: new Date(),
        };
        repositoryMock.updateForUser.mockResolvedValue(updatedCoverLetter);

        const result = await service.updateCoverLetter('cover-letter-123', 'user-123', {
          metadata: updatedMetadata,
        });

        expect(result.success).toBe(true);
        expect(repositoryMock.updateForUser).toHaveBeenCalledWith(
          'cover-letter-123',
          'user-123',
          { metadata: updatedMetadata }
        );
      });
    });

    describe('deleteCoverLetter', () => {
      it('should delete cover letter successfully', async () => {
        const coverLetter = createMockCoverLetter({
          id: 'cover-letter-123',
          userId: 'user-123',
        }) as CoverLetterData;
        repositoryMock.deleteForUser.mockResolvedValue(coverLetter);

        const result = await service.deleteCoverLetter('cover-letter-123', 'user-123');

        expect(result.success).toBe(true);
        expect(repositoryMock.deleteForUser).toHaveBeenCalledWith('cover-letter-123', 'user-123');
      });

      it('should handle deletion errors gracefully', async () => {
        repositoryMock.deleteForUser.mockRejectedValue(new Error('Delete failed'));

        const result = await service.deleteCoverLetter('cover-letter-123', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Delete failed');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });

      it('should handle Prisma record not found error', async () => {
        const prismaError = new Error('Record to delete does not exist');
        prismaError.name = 'PrismaClientKnownRequestError';
        (prismaError as unknown as { code: string }).code = 'P2025';
        repositoryMock.deleteForUser.mockRejectedValue(prismaError);

        const result = await service.deleteCoverLetter('invalid-id', 'user-123');

        expect(result.success).toBe(false);
      });
    });
  });

  describe('Validation and Error Handling', () => {
    describe('empty userId', () => {
      it('should handle empty userId in getUserCoverLetters', async () => {
        repositoryMock.findAllForUserWithCount.mockResolvedValue({
          coverLetters: [],
          total: 0,
        });

        const result = await service.getUserCoverLetters('');

        expect(result.success).toBe(true);
        expect(repositoryMock.findAllForUserWithCount).toHaveBeenCalledWith('', undefined);
      });
    });

    describe('ServiceResult error codes', () => {
      it('should return ServiceResult with NOT_FOUND code', async () => {
        repositoryMock.findByIdForUser.mockResolvedValue(null);

        const result = await service.getCoverLetter('non-existent', 'user-123');

        expect(result).toEqual({
          success: false,
          error: expect.stringContaining('not found'),
          code: 'NOT_FOUND',
        });
      });

      it('should return ServiceResult with INTERNAL_ERROR code on generic error', async () => {
        repositoryMock.findAllForUserWithCount.mockRejectedValue(new Error('Connection timeout'));

        const result = await service.getUserCoverLetters('user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });

      it('should preserve error messages from repository', async () => {
        repositoryMock.findByIdForUser.mockRejectedValue(new Error('DB connection lost'));

        const result = await service.getCoverLetter('cover-letter-123', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('DB connection lost');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });
    });

    describe('Prisma-specific errors', () => {
      it('should handle Prisma constraint violation errors', async () => {
        const prismaError = new Error('Unique constraint violation');
        prismaError.name = 'PrismaClientKnownRequestError';
        repositoryMock.create.mockRejectedValue(prismaError);

        const input: CreateCoverLetterInput = {
          userId: 'user-123',
          content: 'Content',
          metadata: {},
        };
        const result = await service.createCoverLetter(input);

        expect(result.success).toBe(false);
      });

      it('should handle Prisma validation errors', async () => {
        const prismaError = new Error('Invalid data');
        prismaError.name = 'PrismaClientValidationError';
        repositoryMock.updateForUser.mockRejectedValue(prismaError);

        const result = await service.updateCoverLetter('cover-letter-123', 'user-123', {
          content: 'New content',
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long cover letter content', async () => {
      const longContent = 'A'.repeat(50000);
      const coverLetter = createMockCoverLetter({
        id: 'cover-letter-123',
        userId: 'user-123',
        content: longContent,
      }) as CoverLetterData;
      repositoryMock.updateForUser.mockResolvedValue({ ...coverLetter, content: longContent });

      const result = await service.updateCoverLetter('cover-letter-123', 'user-123', {
        content: longContent,
      });

      expect(result.success).toBe(true);
    });

    it('should handle special characters in content', async () => {
      const specialContent = "Dear Manager,\n\nI'm excited about <Company> & \"Team\" 👋\n\nBest regards";
      const coverLetter = createMockCoverLetter({
        id: 'cover-letter-123',
        userId: 'user-123',
      }) as CoverLetterData;
      repositoryMock.updateForUser.mockResolvedValue({
        ...coverLetter,
        content: specialContent,
        updatedAt: new Date(),
      });

      const result = await service.updateCoverLetter('cover-letter-123', 'user-123', {
        content: specialContent,
      });

      expect(result.success).toBe(true);
    });

    it('should handle null resumeId in create', async () => {
      const input: CreateCoverLetterInput = {
        userId: 'user-123',
        content: 'Content without resume',
        resumeId: null,
        metadata: {},
      };
      const createdCoverLetter = createMockCoverLetter({
        id: 'cover-letter-new',
        userId: input.userId,
        resumeId: null,
      }) as CoverLetterData;
      repositoryMock.create.mockResolvedValue(createdCoverLetter);
      notificationServiceMock.notifyCoverLetterGenerated.mockResolvedValue({
        success: true,
        data: {} as never,
      });

      const result = await service.createCoverLetter(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resumeId).toBeNull();
      }
    });

    it('should handle concurrent operations gracefully', async () => {
      const coverLetter = createMockCoverLetter({
        id: 'cover-letter-123',
        userId: 'user-123',
      }) as CoverLetterData;
      repositoryMock.findByIdForUser.mockResolvedValue(coverLetter);
      repositoryMock.deleteForUser.mockResolvedValue(coverLetter);

      const results = await Promise.all([
        service.deleteCoverLetter('cover-letter-123', 'user-123'),
        service.getCoverLetter('cover-letter-123', 'user-123'),
      ]);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(typeof result.success).toBe('boolean');
      });
    });

    it('should handle metadata with undefined optional fields', async () => {
      const input: CreateCoverLetterInput = {
        userId: 'user-123',
        content: 'Content',
        metadata: {
          jobTitle: undefined,
          companyName: undefined,
        },
      };
      const createdCoverLetter = createMockCoverLetter({
        id: 'cover-letter-new',
        userId: input.userId,
      }) as CoverLetterData;
      repositoryMock.create.mockResolvedValue(createdCoverLetter);
      notificationServiceMock.notifyCoverLetterGenerated.mockResolvedValue({
        success: true,
        data: {} as never,
      });

      const result = await service.createCoverLetter(input);

      expect(result.success).toBe(true);
      expect(notificationServiceMock.notifyCoverLetterGenerated).toHaveBeenCalledWith(
        'user-123',
        'cover-letter-new',
        undefined,
        undefined
      );
    });

    it('should handle pagination options correctly', async () => {
      const coverLetters = createMockCoverLetters(10, 'user-123') as CoverLetterData[];
      repositoryMock.findAllForUserWithCount.mockResolvedValue({
        coverLetters: coverLetters.slice(5, 10),
        total: 100,
      });

      const result = await service.getUserCoverLetters('user-123', {
        limit: 5,
        offset: 5,
        orderBy: 'createdAt',
        orderDir: 'desc',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.coverLetters).toHaveLength(5);
        expect(result.data.total).toBe(100);
      }
    });
  });
});
