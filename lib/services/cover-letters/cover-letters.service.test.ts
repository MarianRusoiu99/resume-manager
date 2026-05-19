import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoverLetterService } from './cover-letters.service';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { CoverLetterRepository } from '@/lib/repositories/cover-letters.repository';

describe('CoverLetterService', () => {
  let service: CoverLetterService;
  let repositoryMock: ReturnType<typeof mockDeep<CoverLetterRepository>>;

  beforeEach(() => {
    repositoryMock = mockDeep<CoverLetterRepository>();
    mockReset(repositoryMock);
    service = new CoverLetterService(repositoryMock);
  });

  describe('createCoverLetter', () => {
    it('should create a new cover letter', async () => {
      const mockCL = { id: 'cl-1', userId: 'u1', content: 'test' };
      repositoryMock.create.mockResolvedValue(mockCL as never);

      const result = await service.createCoverLetter({
        userId: 'u1',
        content: 'test',
        metadata: {}
      } as never);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('cl-1');
      }
    });
  });

  describe('getCoverLetter', () => {
    it('should get cover letter by id', async () => {
      const mockCL = { id: 'cl-1', userId: 'u1', content: 'test' };
      repositoryMock.findByIdForUser.mockResolvedValue(mockCL as never);

      const result = await service.getCoverLetter('cl-1', 'u1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('cl-1');
      }
    });
  });

  describe('getUserCoverLetters', () => {
    it('should list user cover letters with count', async () => {
      const mockData = {
        coverLetters: [{ id: 'cl-1', userId: 'u1' }],
        total: 1
      };
      repositoryMock.findAllForUserWithCount.mockResolvedValue(mockData as never);

      const result = await service.getUserCoverLetters('u1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.coverLetters).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });
  });
});
