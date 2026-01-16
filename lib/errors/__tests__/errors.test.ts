
import { describe, it, expect } from 'vitest';
import { AppError } from '../base';
import { ApiError, RateLimitError } from '../api';
import { UnauthorizedError } from '../authentication';
import { ServiceErrorCode } from '@/lib/types/service-result';

describe('Error Classes', () => {
  describe('AppError', () => {
    class TestError extends AppError {
      readonly code = 'INTERNAL_ERROR' as ServiceErrorCode;
      readonly statusCode = 500;
    }

    it('should maintain stack trace', () => {
      const error = new TestError('test message');
      expect(error.stack).toBeDefined();
      expect(error.name).toBe('TestError');
    });

    it('should serialize to JSON correctly', () => {
      const error = new TestError('test message');
      const json = error.toJSON();
      expect(json).toEqual({
        error: 'test message',
        code: 'INTERNAL_ERROR',
        name: 'TestError',
      });
    });

    it('should support cause property', () => {
      const cause = new Error('original error');
      const error = new TestError('wrapper error', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('RateLimitError', () => {
    it('should set 429 status code', () => {
      const error = new RateLimitError('too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMITED');
    });

    it('should include retryAfter in message if provided', () => {
      const error = new RateLimitError('limit exceeded', 60);
      expect(error.message).toContain('limit exceeded');
      expect(error.retryAfterMs).toBe(60);
    });
  });

  describe('UnauthorizedError', () => {
    it('should set 401 status code', () => {
      const error = new UnauthorizedError('unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });
});
