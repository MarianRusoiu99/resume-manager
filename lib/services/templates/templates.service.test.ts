import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateService } from './templates.workflow';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { TemplateRepository } from '@/lib/repositories/templates.repository';
import * as redisClient from '@/lib/redis/client';

describe('TemplateService', () => {
  let service: TemplateService;
  let repositoryMock: ReturnType<typeof mockDeep<TemplateRepository>>;
  let cacheMock: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repositoryMock = mockDeep<TemplateRepository>();
    mockReset(repositoryMock);
    
    cacheMock = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    
    vi.spyOn(redisClient, 'getCacheProvider').mockReturnValue(cacheMock);
    
    service = new TemplateService(repositoryMock);
  });

  describe('getAllPublicTemplates', () => {
    it('should return templates from cache if available', async () => {
      const mockTemplates = [{ id: 't1', name: 'Template 1', htmlTemplate: '<div></div>' }];
      cacheMock.get.mockResolvedValue(JSON.stringify(mockTemplates));

      const result = await service.getAllPublicTemplates();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockTemplates);
      }
      expect(repositoryMock.findAllPublic).not.toHaveBeenCalled();
    });

    it('should fetch from repository if cache is empty', async () => {
      const mockTemplates = [{ id: 't1', name: 'Template 1', htmlTemplate: '<div></div>' }];
      cacheMock.get.mockResolvedValue(null);
      repositoryMock.findAllPublic.mockResolvedValue(mockTemplates);

      const result = await service.getAllPublicTemplates();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockTemplates);
      }
      expect(repositoryMock.findAllPublic).toHaveBeenCalled();
      expect(cacheMock.set).toHaveBeenCalled();
    });
  });

  describe('getTemplateById', () => {
    it('should return a template by id', async () => {
      const mockTemplate = { id: 't1', name: 'Template 1', htmlTemplate: '<div></div>' };
      repositoryMock.findById.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateById('t1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('t1');
      }
    });
  });
});
