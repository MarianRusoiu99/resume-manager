import { describe, it, expect } from 'vitest';
import { createProfileSchema, updateProfileSchema } from './api-schemas';

describe('API Schemas', () => {
  describe('createProfileSchema', () => {
    it('should validate valid profile data', () => {
      const validData = {
        name: 'My Profile',
        resume: {
          basics: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      };

      const result = createProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Profile');
        expect(result.data.isDefault).toBe(false); // default value
      }
    });

    it('should reject profile without name', () => {
      const invalidData = {
        resume: {
          basics: {
            name: 'John Doe',
          },
        },
      };

      const result = createProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject profile with empty name', () => {
      const invalidData = {
        name: '',
        resume: {
          basics: {
            name: 'John Doe',
          },
        },
      };

      const result = createProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject profile with name too long', () => {
      const invalidData = {
        name: 'a'.repeat(101),
        resume: {
          basics: {
            name: 'John Doe',
          },
        },
      };

      const result = createProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('should validate partial update', () => {
      const validData = {
        name: 'Updated Name',
      };

      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
      }
    });

    it('should allow updating isPublic', () => {
      const validData = {
        isPublic: true,
        publicSlug: 'my-resume',
      };

      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(true);
        expect(result.data.publicSlug).toBe('my-resume');
      }
    });

    it('should allow empty object for update', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
