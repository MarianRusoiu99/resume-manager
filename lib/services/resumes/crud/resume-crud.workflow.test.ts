import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResumeCrudService } from './resume-crud.workflow';
import { createMockResume, createMockResumeData } from '@/lib/test/factories';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { GeneratedResumeRepository } from '@/lib/repositories/generated-resumes.repository';
import { NotFoundError } from '@/lib/services/utils';

describe('ResumeCrudService', () => {
  let service: ResumeCrudService;
  let repositoryMock: ReturnType<typeof mockDeep<GeneratedResumeRepository>>;

  beforeEach(() => {
    repositoryMock = mockDeep<GeneratedResumeRepository>();
    mockReset(repositoryMock);
    service = new ResumeCrudService(repositoryMock);
  });

  describe('listResumes', () => {
    it('should list all resumes for a user', async () => {
      const resumes = [
        createMockResume({ id: 'resume-1' }),
        createMockResume({ id: 'resume-2' }),
      ];

      repositoryMock.findByUserId.mockResolvedValue(resumes);

      const result = await service.listResumes('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('resume-1');
      }
      expect(repositoryMock.findByUserId).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getResume', () => {
    it('should get a single resume', async () => {
      const resume = createMockResume();
      repositoryMock.findById.mockResolvedValue(resume);

      const result = await service.getResume(resume.id, resume.userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(resume.id);
      }
    });

    it('should return error when resume does not exist', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      const result = await service.getResume('invalid-id', 'user-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Resume not found');
      }
    });
  });

  describe('deleteResume', () => {
    it('should delete a resume', async () => {
      const resume = createMockResume();
      repositoryMock.findById.mockResolvedValue(resume);
      repositoryMock.delete.mockResolvedValue(resume);

      const result = await service.deleteResume(resume.id, resume.userId);

      expect(result.success).toBe(true);
      expect(repositoryMock.delete).toHaveBeenCalledWith(resume.id, resume.userId);
    });

    it('should return error when resume to delete does not exist', async () => {
      repositoryMock.findById.mockResolvedValue(null);

      const result = await service.deleteResume('invalid-id', 'user-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Resume not found');
      }
    });
  });

  describe('updateResumeContent', () => {
    it('should update resume content', async () => {
      const resume = createMockResume();
      const updatedResume = { ...resume, updatedAt: new Date() };
      repositoryMock.update.mockResolvedValue(updatedResume);

      const result = await service.updateResumeContent(resume.id, resume.userId, resume.resume!);

      expect(result.success).toBe(true);
      expect(repositoryMock.update).toHaveBeenCalled();
    });
  });

  describe('duplicateResume', () => {
    it('should duplicate an existing resume', async () => {
      const resume = createMockResume();
      const duplicatedResume = createMockResume({ id: 'resume-copy' });
      
      repositoryMock.findById.mockResolvedValue(resume);
      repositoryMock.create.mockResolvedValue(duplicatedResume);

      const result = await service.duplicateResume(resume.id, resume.userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('resume-copy');
      }
      expect(repositoryMock.create).toHaveBeenCalled();
    });
  });
});
