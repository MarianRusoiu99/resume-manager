
import { describe, it, expect } from 'vitest';
import { 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  ConfigurationError,
  InternalError,
  AppError
} from '../index';
import { errorCodeToHttpStatus } from '@/lib/types';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should be an instance of Error', () => {
      const error = new NotFoundError('Resource');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should correctly set message and cause', () => {
      const cause = new Error('Root cause');
      const error = new InternalError('Something failed', cause);
      
      expect(error.message).toBe('Something failed');
      expect(error.cause).toBe(cause);
    });

    it('should implement toJSON', () => {
      const error = new ValidationError('Invalid input', 'email');
      const json = error.toJSON();
      
      expect(json).toEqual({
        code: 'VALIDATION_ERROR',
        error: 'Invalid input',
        name: 'ValidationError',
      });
    });
  });

  describe('NotFoundError', () => {
    it('should have correct code and status', () => {
      const error = new NotFoundError('User');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });
  });

  describe('ValidationError', () => {
    it('should have correct code and status', () => {
      const error = new ValidationError('Invalid email');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid email');
    });

    it('should support field and details', () => {
      const details = [{ field: 'email', message: 'Invalid format' }];
      const error = new ValidationError('Validation failed', 'email', details as any);
      
      expect(error.field).toBe('email');
      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should have correct code and status', () => {
      const error = new UnauthorizedError();
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should have correct code and status', () => {
      const error = new ForbiddenError();
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('ConflictError', () => {
    it('should have correct code and status', () => {
      const error = new ConflictError('User exists');
      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('RateLimitError', () => {
    it('should have correct code and status', () => {
      const error = new RateLimitError('Too many requests', 1000);
      expect(error.code).toBe('RATE_LIMITED');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfterMs).toBe(1000);
    });
  });

  describe('ExternalServiceError', () => {
    it('should have correct code and status', () => {
      const error = new ExternalServiceError('OpenAI');
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.statusCode).toBe(502);
    });
  });

  describe('ConfigurationError', () => {
    it('should have correct code and status', () => {
      const error = new ConfigurationError('Missing key');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('InternalError', () => {
    it('should have correct code and status', () => {
      const error = new InternalError('Crash');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('Status Code Mapping', () => {
    it('should match errorCodeToHttpStatus', () => {
      const error = new NotFoundError();
      expect(errorCodeToHttpStatus[error.code]).toBe(error.statusCode);
    });
  });
});
