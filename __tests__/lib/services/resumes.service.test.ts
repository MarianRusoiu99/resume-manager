import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { GeneratedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import type { Resume } from '@/lib/validations/jsonresume';
import { createMockResume, createMockResumes } from '@/lib/test/test-factories';
import { ResumeService as ResumeCrudService } from '@/lib/services/resumes/resume.service';

describe('ResumeCrudService', () => {
  let service: ResumeCrudService;
  let repositoryMock: ReturnType<typeof mockDeep<GeneratedResumeRepository>>;

  beforeEach(() => {
    repositoryMock = mockDeep<GeneratedResumeRepository>();
    mockReset(repositoryMock);
    service = new ResumeCrudService(repositoryMock, {} as any, {} as any);
  });

  describe('CRUD Operations', () => {
    describe('listResumes', () => {
      it('should return list of resumes for a user', async () => {
        const resumes = createMockResumes(3, 'user-123');
        repositoryMock.findByUserId.mockResolvedValue(resumes);

        const result = await service.listResumes('user-123');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(3);
        }
        expect(repositoryMock.findByUserId).toHaveBeenCalledWith('user-123');
      });

      it('should return empty list when user has no resumes', async () => {
        repositoryMock.findByUserId.mockResolvedValue([]);

        const result = await service.listResumes('user-123');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual([]);
        }
      });

      it('should handle repository errors gracefully', async () => {
        repositoryMock.findByUserId.mockRejectedValue(new Error('Database error'));

        const result = await service.listResumes('user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Database error');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });
    });

    describe('getUserResumes (alias)', () => {
      it('should delegate to listResumes', async () => {
        const resumes = createMockResumes(2, 'user-123');
        repositoryMock.findByUserId.mockResolvedValue(resumes);

        const result = await service.getUserResumes('user-123');

        expect(result.success).toBe(true);
        expect(repositoryMock.findByUserId).toHaveBeenCalledWith('user-123');
      });
    });

    describe('getResume', () => {
      it('should return resume when found', async () => {
        const resume = createMockResume({ id: 'resume-123', userId: 'user-123' });
        repositoryMock.findById.mockResolvedValue(resume);

        const result = await service.getResume('resume-123', 'user-123');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe('resume-123');
        }
        expect(repositoryMock.findById).toHaveBeenCalledWith('resume-123', 'user-123');
      });

      it('should return NOT_FOUND error when resume does not exist', async () => {
        repositoryMock.findById.mockResolvedValue(null);

        const result = await service.getResume('invalid-id', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Resume not found');
          expect(result.code).toBe('NOT_FOUND');
        }
      });

      it('should handle repository errors gracefully', async () => {
        repositoryMock.findById.mockRejectedValue(new Error('Database error'));

        const result = await service.getResume('resume-123', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Database error');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });
    });

    describe('deleteResume', () => {
      it('should delete resume when found', async () => {
        const resume = createMockResume({ id: 'resume-123', userId: 'user-123' });
        repositoryMock.findById.mockResolvedValue(resume);
        repositoryMock.delete.mockResolvedValue(resume);

        const result = await service.deleteResume('resume-123', 'user-123');

        expect(result.success).toBe(true);
        expect(repositoryMock.delete).toHaveBeenCalledWith('resume-123', 'user-123');
      });

      it('should return NOT_FOUND error when resume does not exist', async () => {
        repositoryMock.findById.mockResolvedValue(null);

        const result = await service.deleteResume('invalid-id', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Resume not found');
          expect(result.code).toBe('NOT_FOUND');
        }
        expect(repositoryMock.delete).not.toHaveBeenCalled();
      });

      it('should handle deletion errors gracefully', async () => {
        const resume = createMockResume({ id: 'resume-123', userId: 'user-123' });
        repositoryMock.findById.mockResolvedValue(resume);
        repositoryMock.delete.mockRejectedValue(new Error('Delete failed'));

        const result = await service.deleteResume('resume-123', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Delete failed');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });
    });

    describe('updateResumeContent', () => {
      it('should update resume content successfully', async () => {
        const resume = createMockResume({ id: 'resume-123', userId: 'user-123' });
        const updatedResumeData: Resume = {
          basics: {
            name: 'Updated Name',
            email: 'updated@example.com',
          },
        };
        const updatedResume = { ...resume, resume: updatedResumeData, updatedAt: new Date() };
        repositoryMock.update.mockResolvedValue(updatedResume);

        const result = await service.updateResumeContent('resume-123', 'user-123', updatedResumeData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.resume).toEqual(updatedResumeData);
        }
        expect(repositoryMock.update).toHaveBeenCalledWith('resume-123', { resume: updatedResumeData }, 'user-123');
      });

      it('should handle update errors gracefully', async () => {
        repositoryMock.update.mockRejectedValue(new Error('Update failed'));

        const result = await service.updateResumeContent('resume-123', 'user-123', { basics: { name: 'Test' } });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Update failed');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });
    });

    describe('updateResumeTemplate', () => {
      it('should update resume template successfully', async () => {
        const resume = createMockResume({ id: 'resume-123', userId: 'user-123' });
        const updatedResume = { ...resume, templateId: 'new-template', updatedAt: new Date() };
        repositoryMock.updateTemplate.mockResolvedValue(updatedResume);

        const result = await service.updateResumeTemplate('resume-123', 'user-123', 'new-template');

        expect(result.success).toBe(true);
        expect(repositoryMock.updateTemplate).toHaveBeenCalledWith('resume-123', 'new-template');
      });

      it('should handle null templateId (remove template)', async () => {
        const resume = createMockResume({ id: 'resume-123', userId: 'user-123' });
        const updatedResume = { ...resume, templateId: null, updatedAt: new Date() };
        repositoryMock.updateTemplate.mockResolvedValue(updatedResume);

        const result = await service.updateResumeTemplate('resume-123', 'user-123', null);

        expect(result.success).toBe(true);
        expect(repositoryMock.updateTemplate).toHaveBeenCalledWith('resume-123', undefined);
      });

      it('should handle template update errors gracefully', async () => {
        repositoryMock.updateTemplate.mockRejectedValue(new Error('Template update failed'));

        const result = await service.updateResumeTemplate('resume-123', 'user-123', 'new-template');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Template update failed');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });
    });

    describe('updateResumeJobDetails', () => {
      it('should update job title and company name', async () => {
        const resume = createMockResume({
          id: 'resume-123',
          userId: 'user-123',
          jobMetadata: { jobTitle: 'Old Title', companyName: 'Old Company' },
        });
        repositoryMock.findById.mockResolvedValue(resume);

        const updatedResume = {
          ...resume,
          jobMetadata: { jobTitle: 'New Title', companyName: 'New Company' },
          updatedAt: new Date(),
        };
        repositoryMock.updateJobDetails.mockResolvedValue(updatedResume);

        const result = await service.updateResumeJobDetails('resume-123', 'user-123', {
          jobTitle: 'New Title',
          companyName: 'New Company',
        });

        expect(result.success).toBe(true);
        expect(repositoryMock.updateJobDetails).toHaveBeenCalled();
      });

      it('should update job description', async () => {
        const resume = createMockResume({ id: 'resume-123', userId: 'user-123' });
        repositoryMock.findById.mockResolvedValue(resume);

        const updatedResume = {
          ...resume,
          jobDescription: 'Updated job description',
          updatedAt: new Date(),
        };
        repositoryMock.updateJobDetails.mockResolvedValue(updatedResume);

        const result = await service.updateResumeJobDetails('resume-123', 'user-123', {
          jobDescription: 'Updated job description',
        });

        expect(result.success).toBe(true);
        expect(repositoryMock.updateJobDetails).toHaveBeenCalledWith('resume-123', expect.objectContaining({
          jobDescription: 'Updated job description',
        }));
      });

      it('should return NOT_FOUND when resume does not exist', async () => {
        repositoryMock.findById.mockResolvedValue(null);

        const result = await service.updateResumeJobDetails('invalid-id', 'user-123', {
          jobTitle: 'New Title',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Resume not found');
          expect(result.code).toBe('NOT_FOUND');
        }
      });

      it('should handle partial updates (only jobTitle)', async () => {
        const resume = createMockResume({
          id: 'resume-123',
          userId: 'user-123',
          jobMetadata: { jobTitle: 'Old Title', companyName: 'Company' },
        });
        repositoryMock.findById.mockResolvedValue(resume);

        const updatedResume = {
          ...resume,
          jobMetadata: { jobTitle: 'New Title', companyName: 'Company' },
          updatedAt: new Date(),
        };
        repositoryMock.updateJobDetails.mockResolvedValue(updatedResume);

        const result = await service.updateResumeJobDetails('resume-123', 'user-123', {
          jobTitle: 'New Title',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('duplicateResume', () => {
      it('should duplicate an existing resume', async () => {
        const originalResume = createMockResume({
          id: 'original-123',
          userId: 'user-123',
          jobMetadata: { jobTitle: 'Engineer', companyName: 'Tech Corp' },
        });
        const duplicatedResume = createMockResume({
          id: 'copy-123',
          userId: 'user-123',
          jobMetadata: { jobTitle: 'Engineer (Copy)', companyName: 'Tech Corp' },
        });

        repositoryMock.findById.mockResolvedValue(originalResume);
        repositoryMock.create.mockResolvedValue(duplicatedResume);

        const result = await service.duplicateResume('original-123', 'user-123');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe('copy-123');
        }
        expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
          userId: 'user-123',
          jobMetadata: expect.objectContaining({
            jobTitle: expect.stringContaining('(Copy)'),
          }),
        }));
      });

      it('should return NOT_FOUND when original resume does not exist', async () => {
        repositoryMock.findById.mockResolvedValue(null);

        const result = await service.duplicateResume('invalid-id', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Resume not found');
          expect(result.code).toBe('NOT_FOUND');
        }
        expect(repositoryMock.create).not.toHaveBeenCalled();
      });

      it('should handle duplication errors gracefully', async () => {
        const originalResume = createMockResume({ id: 'original-123', userId: 'user-123' });
        repositoryMock.findById.mockResolvedValue(originalResume);
        repositoryMock.create.mockRejectedValue(new Error('Create failed'));

        const result = await service.duplicateResume('original-123', 'user-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Create failed');
          expect(result.code).toBe('INTERNAL_ERROR');
        }
      });
    });
  });

  describe('Validation Failure Scenarios', () => {
    describe('empty userId', () => {
      it('should handle empty userId in listResumes', async () => {
        repositoryMock.findByUserId.mockResolvedValue([]);

        const result = await service.listResumes('');

        expect(result.success).toBe(true);
        expect(repositoryMock.findByUserId).toHaveBeenCalledWith('');
      });
    });

    describe('malformed data handling', () => {
      it('should handle null jobMetadata when duplicating', async () => {
        const resumeWithNullMetadata = createMockResume({
          id: 'resume-123',
          userId: 'user-123',
          jobMetadata: null as unknown as Record<string, unknown>,
        });
        repositoryMock.findById.mockResolvedValue(resumeWithNullMetadata);
        repositoryMock.create.mockResolvedValue(createMockResume({ id: 'copy-123' }));

        const result = await service.duplicateResume('resume-123', 'user-123');

        expect(result.success).toBe(true);
        expect(repositoryMock.create).toHaveBeenCalled();
      });

      it('should handle undefined jobMetadata fields when updating job details', async () => {
        const resume = createMockResume({
          id: 'resume-123',
          userId: 'user-123',
          jobMetadata: null as unknown as Record<string, unknown>,
        });
        repositoryMock.findById.mockResolvedValue(resume);

        const updatedResume = { ...resume, jobMetadata: { jobTitle: 'New Title' }, updatedAt: new Date() };
        repositoryMock.updateJobDetails.mockResolvedValue(updatedResume);

        const result = await service.updateResumeJobDetails('resume-123', 'user-123', {
          jobTitle: 'New Title',
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Handling Paths - ServiceResult', () => {
    it('should return ServiceResult with success=false on NotFoundError', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      const result = await service.getResume('non-existent', 'user-123');

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('not found'),
        code: 'NOT_FOUND',
      });
    });

    it('should return ServiceResult with success=false on generic error', async () => {
      repositoryMock.findByUserId.mockRejectedValue(new Error('Connection timeout'));

      const result = await service.listResumes('user-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should preserve error messages from repository', async () => {
      repositoryMock.findById.mockRejectedValue(new Error('DB connection lost'));

      const result = await service.getResume('resume-123', 'user-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('DB connection lost');
        expect(result.code).toBe('INTERNAL_ERROR');
      }
    });

    it('should handle Prisma-specific errors', async () => {
      const prismaError = new Error('Unique constraint violation');
      prismaError.name = 'PrismaClientKnownRequestError';
      repositoryMock.create.mockRejectedValue(prismaError);

      const originalResume = createMockResume({ id: 'original-123', userId: 'user-123' });
      repositoryMock.findById.mockResolvedValue(originalResume);

      const result = await service.duplicateResume('original-123', 'user-123');

      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long job descriptions', async () => {
      const longDescription = 'A'.repeat(10000);
      const resume = createMockResume({ id: 'resume-123', userId: 'user-123' });
      repositoryMock.findById.mockResolvedValue(resume);

      const updatedResume = { ...resume, jobDescription: longDescription, updatedAt: new Date() };
      repositoryMock.updateJobDetails.mockResolvedValue(updatedResume);

      const result = await service.updateResumeJobDetails('resume-123', 'user-123', {
        jobDescription: longDescription,
      });

      expect(result.success).toBe(true);
    });

    it('should handle special characters in job metadata', async () => {
      const resume = createMockResume({
        id: 'resume-123',
        userId: 'user-123',
        jobMetadata: { jobTitle: 'Test', companyName: 'Test' },
      });
      repositoryMock.findById.mockResolvedValue(resume);

      const specialChars = {
        jobTitle: 'Senior Engineer 👨‍💻 @ <Company>',
        companyName: "O'Reilly & Sons \"Ltd\"",
      };
      const updatedResume = { ...resume, jobMetadata: specialChars, updatedAt: new Date() };
      repositoryMock.updateJobDetails.mockResolvedValue(updatedResume);

      const result = await service.updateResumeJobDetails('resume-123', 'user-123', specialChars);

      expect(result.success).toBe(true);
    });

    it('should handle concurrent operations gracefully', async () => {
      const resume = createMockResume({ id: 'resume-123', userId: 'user-123' });
      repositoryMock.findById.mockResolvedValue(resume);
      repositoryMock.delete.mockResolvedValue(resume);

      const results = await Promise.all([
        service.deleteResume('resume-123', 'user-123'),
        service.getResume('resume-123', 'user-123'),
      ]);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(typeof result.success).toBe('boolean');
      });
    });
  });
});
