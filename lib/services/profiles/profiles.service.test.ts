/**
 * Tests for Profile Service
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ProfileService } from '@/lib/services/profiles/profiles.service';
import { ProfileRepository } from '@/lib/repositories/profiles.repository';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase, testDb } from '@/lib/test/setup';
import { createTestUser, createTestProfile } from '@/lib/test/factories';
import { profileCache } from '@/lib/cache/simple-cache';
import type { Resume } from '@/lib/validations/jsonresume';

describe('ProfileService', () => {
  let service: ProfileService;
  let repository: ProfileRepository;
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    repository = new ProfileRepository(testDb);
    service = new ProfileService(repository, profileCache);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    profileCache.clear();
    const user = await createTestUser({ email: 'profile-service-test@example.com' });
    testUserId = user.id;
  });

  describe('createProfile', () => {
    it('should create a profile successfully', async () => {
      const resume: Resume = {
        basics: {
          name: 'John Doe',
          label: 'Software Engineer',
          email: 'john@example.com',
          profiles: [],
        },
        work: [],
        education: [],
        skills: [],
        projects: [],
      };

      const result = await service.createProfile(testUserId, 'My Profile', resume, false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Profile');
        expect(result.data.userId).toBe(testUserId);
        expect(result.data.resume).toEqual(resume);
      }
    });

    it('should set profile as default when specified', async () => {
      const resume: Resume = {
        basics: {
          name: 'John Doe',
          label: 'Software Engineer',
          profiles: [],
        },
        work: [],
        education: [],
        skills: [],
        projects: [],
      };

      const result = await service.createProfile(testUserId, 'Default Profile', resume, true);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDefault).toBe(true);
      }
    });

    it('should unset previous default when creating new default', async () => {
      const resume: Resume = {
        basics: {
          name: 'Test User',
          profiles: [],
        },
        work: [],
        education: [],
        skills: [],
        projects: [],
      };

      await createTestProfile(testUserId, { name: 'Old Default', isDefault: true });
      
      const result = await service.createProfile(testUserId, 'New Default', resume, true);

      expect(result.success).toBe(true);

      const profiles = await repository.findAllByUserId(testUserId);
      const defaultProfiles = profiles.filter(p => p.isDefault);
      expect(defaultProfiles).toHaveLength(1);
      expect(defaultProfiles[0].name).toBe('New Default');
    });

    it('should fail with invalid resume data', async () => {
      const invalidResume = {
        // Missing required fields
        work: [],
      };

      const result = await service.createProfile(
        testUserId,
        'Invalid Profile',
        invalidResume as Resume,
        false
      );

      expect(result.success).toBe(false);
    });
  });

  describe('getProfiles', () => {
    it('should get all profiles for a user', async () => {
      await createTestProfile(testUserId, { name: 'Profile 1' });
      await createTestProfile(testUserId, { name: 'Profile 2' });

      const result = await service.getProfiles(testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data.map(p => p.name)).toContain('Profile 1');
        expect(result.data.map(p => p.name)).toContain('Profile 2');
      }
    });

    it('should return empty array when user has no profiles', async () => {
      const result = await service.getProfiles(testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('getProfileById', () => {
    it('should get a profile by id', async () => {
      const profile = await createTestProfile(testUserId, { name: 'Test Profile' });

      const result = await service.getProfileById(profile.id, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(profile.id);
        expect(result.data.name).toBe('Test Profile');
      }
    });

    it('should fail when profile not found', async () => {
      const result = await service.getProfileById('non-existent-id', testUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('not found');
      }
    });

    it('should fail when accessing another user profile', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const profile = await createTestProfile(otherUser.id, { name: 'Other Profile' });

      const result = await service.getProfileById(profile.id, testUserId);

      expect(result.success).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update profile name', async () => {
      const profile = await createTestProfile(testUserId, { name: 'Old Name' });

      const result = await service.updateProfile(profile.id, testUserId, { name: 'New Name' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('New Name');
      }
    });

    it('should update profile resume', async () => {
      const profile = await createTestProfile(testUserId, { name: 'Test Profile' });

      const newResume: Resume = {
        basics: {
          name: 'Jane Smith',
          label: 'Designer',
          profiles: [],
        },
        work: [{
          name: 'Acme Corp',
          position: 'Senior Designer',
          startDate: '2020-01-01',
        }],
        education: [],
        skills: [],
        projects: [],
      };

      const result = await service.updateProfile(profile.id, testUserId, { resume: newResume });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resume).toEqual(newResume);
      }
    });

    it('should invalidate cache after update', async () => {
      const profile = await createTestProfile(testUserId, { name: 'Test Profile' });

      // Populate cache
      await service.getProfileById(profile.id, testUserId);

      // Update profile
      await service.updateProfile(profile.id, testUserId, { name: 'Updated Name' });

      // Verify cache was invalidated by fetching again
      const result = await service.getProfileById(profile.id, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
      }
    });
  });

  describe('deleteProfile', () => {
    it('should delete a profile', async () => {
      const profile = await createTestProfile(testUserId, { name: 'To Delete' });

      const result = await service.deleteProfile(profile.id, testUserId);

      expect(result.success).toBe(true);

      const findResult = await service.getProfileById(profile.id, testUserId);
      expect(findResult.success).toBe(false);
    });

    it('should fail when deleting the last profile', async () => {
      const profile = await createTestProfile(testUserId, { name: 'Only Profile' });

      const result = await service.deleteProfile(profile.id, testUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('last profile');
      }
    });

    it('should set another profile as default when deleting default profile', async () => {
      await createTestProfile(testUserId, { name: 'Profile 1', isDefault: true });
      const profile2 = await createTestProfile(testUserId, { name: 'Profile 2', isDefault: false });

      const deleteResult = await service.deleteProfile(
        (await repository.findDefaultByUserId(testUserId))!.id,
        testUserId
      );

      expect(deleteResult.success).toBe(true);

      const profiles = await repository.findAllByUserId(testUserId);
      expect(profiles.some(p => p.isDefault)).toBe(true);
    });
  });

  describe('setDefaultProfile', () => {
    it('should set a profile as default', async () => {
      const profile1 = await createTestProfile(testUserId, { name: 'Profile 1', isDefault: true });
      const profile2 = await createTestProfile(testUserId, { name: 'Profile 2', isDefault: false });

      const result = await service.setDefaultProfile(profile2.id, testUserId);

      expect(result.success).toBe(true);

      const profiles = await repository.findAllByUserId(testUserId);
      const defaultProfiles = profiles.filter(p => p.isDefault);
      expect(defaultProfiles).toHaveLength(1);
      expect(defaultProfiles[0].id).toBe(profile2.id);
    });

    it('should fail when profile not found', async () => {
      const result = await service.setDefaultProfile('non-existent-id', testUserId);

      expect(result.success).toBe(false);
    });
  });

  describe('duplicateProfile', () => {
    it('should duplicate a profile', async () => {
      const originalProfile = await createTestProfile(testUserId, { name: 'Original' });

      const result = await service.duplicateProfile(originalProfile.id, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Original (Copy)');
        expect(result.data.id).not.toBe(originalProfile.id);
        expect(result.data.resume).toEqual(originalProfile.document?.document);
      }
    });

    it('should duplicate with custom name', async () => {
      const originalProfile = await createTestProfile(testUserId, { name: 'Original' });

      const result = await service.duplicateProfile(
        originalProfile.id,
        testUserId,
        'Custom Copy Name'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Custom Copy Name');
      }
    });

    it('should not set duplicate as default', async () => {
      const originalProfile = await createTestProfile(testUserId, { name: 'Original', isDefault: true });

      const result = await service.duplicateProfile(originalProfile.id, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDefault).toBe(false);
      }
    });
  });
});
