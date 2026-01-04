/**
 * Tests for Profile Repository
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ProfileRepository } from '@/lib/repositories/profiles.repository';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase, testDb } from '@/lib/test/setup';
import { createTestUser, createTestProfile } from '@/lib/test/factories';
import type { Resume } from '@/lib/validations/jsonresume';

describe('ProfileRepository', () => {
  let repository: ProfileRepository;
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    repository = new ProfileRepository(testDb);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    const user = await createTestUser({ email: 'profile-repo-test@example.com' });
    testUserId = user.id;
  });

  describe('create', () => {
    it('should create a profile with document', async () => {
      const resume: Resume = {
        basics: {
          name: 'John Doe',
          label: 'Software Engineer',
          email: 'john@example.com',
          phone: '555-0100',
          url: 'https://johndoe.com',
          summary: 'Experienced developer',
          location: {
            city: 'New York',
            countryCode: 'US',
            region: 'NY',
          },
          profiles: [],
        },
        work: [],
        education: [],
        skills: [],
        projects: [],
      };

      const profile = await repository.create({
        userId: testUserId,
        name: 'My Profile',
        resume,
        isDefault: true,
      });

      expect(profile).toBeDefined();
      expect(profile.id).toBeDefined();
      expect(profile.name).toBe('My Profile');
      expect(profile.userId).toBe(testUserId);
      expect(profile.isDefault).toBe(true);
      expect(profile.resume).toEqual(resume);
    });
  });

  describe('findById', () => {
    it('should find a profile by id', async () => {
      const created = await createTestProfile(testUserId, { name: 'Test Profile' });

      const profile = await repository.findById(created.id, testUserId);

      expect(profile).toBeDefined();
      expect(profile?.id).toBe(created.id);
      expect(profile?.name).toBe('Test Profile');
    });

    it('should return null for non-existent profile', async () => {
      const profile = await repository.findById('non-existent-id', testUserId);

      expect(profile).toBeNull();
    });

    it('should return null for profile belonging to different user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const profile = await createTestProfile(otherUser.id, { name: 'Other Profile' });

      const result = await repository.findById(profile.id, testUserId);

      expect(result).toBeNull();
    });
  });

  describe('findAllByUserId', () => {
    it('should find all profiles for a user', async () => {
      await createTestProfile(testUserId, { name: 'Profile 1' });
      await createTestProfile(testUserId, { name: 'Profile 2' });
      await createTestProfile(testUserId, { name: 'Profile 3' });

      const profiles = await repository.findAllByUserId(testUserId);

      expect(profiles).toHaveLength(3);
      expect(profiles.map(p => p.name)).toContain('Profile 1');
      expect(profiles.map(p => p.name)).toContain('Profile 2');
      expect(profiles.map(p => p.name)).toContain('Profile 3');
    });

    it('should return empty array when user has no profiles', async () => {
      const profiles = await repository.findAllByUserId(testUserId);

      expect(profiles).toEqual([]);
    });

    it('should sort profiles with default first', async () => {
      await createTestProfile(testUserId, { name: 'Profile 1', isDefault: false });
      await createTestProfile(testUserId, { name: 'Profile 2', isDefault: true });
      await createTestProfile(testUserId, { name: 'Profile 3', isDefault: false });

      const profiles = await repository.findAllByUserId(testUserId);

      expect(profiles[0].name).toBe('Profile 2');
      expect(profiles[0].isDefault).toBe(true);
    });
  });

  describe('findDefaultByUserId', () => {
    it('should find the default profile for a user', async () => {
      await createTestProfile(testUserId, { name: 'Profile 1', isDefault: false });
      await createTestProfile(testUserId, { name: 'Default Profile', isDefault: true });

      const profile = await repository.findDefaultByUserId(testUserId);

      expect(profile).toBeDefined();
      expect(profile?.name).toBe('Default Profile');
      expect(profile?.isDefault).toBe(true);
    });

    it('should return null when no default profile exists', async () => {
      await createTestProfile(testUserId, { name: 'Profile 1', isDefault: false });

      const profile = await repository.findDefaultByUserId(testUserId);

      expect(profile).toBeNull();
    });
  });

  describe('update', () => {
    it('should update profile name', async () => {
      const profile = await createTestProfile(testUserId, { name: 'Old Name' });

      const updated = await repository.update(profile.id, { name: 'New Name' }, testUserId);

      expect(updated.name).toBe('New Name');
      expect(updated.id).toBe(profile.id);
    });

    it('should update profile document', async () => {
      const profile = await createTestProfile(testUserId, { name: 'Test Profile' });

      const newResume: Resume = {
        basics: {
          name: 'Jane Smith',
          label: 'Designer',
          email: 'jane@example.com',
          profiles: [],
        },
        work: [],
        education: [],
        skills: [],
        projects: [],
      };

      const updated = await repository.update(profile.id, { resume: newResume }, testUserId);

      expect(updated.resume).toEqual(newResume);
    });

    it('should update isDefault flag', async () => {
      const profile = await createTestProfile(testUserId, { name: 'Test Profile', isDefault: false });

      const updated = await repository.update(profile.id, { isDefault: true }, testUserId);

      expect(updated.isDefault).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a profile', async () => {
      const profile = await createTestProfile(testUserId, { name: 'To Delete' });

      await repository.delete(profile.id, testUserId);

      const found = await repository.findById(profile.id, testUserId);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent profile', async () => {
      await expect(repository.delete('non-existent-id', testUserId)).rejects.toThrow();
    });
  });

  describe('unsetAllDefaults', () => {
    it('should unset all default flags for a user', async () => {
      await createTestProfile(testUserId, { name: 'Profile 1', isDefault: true });
      await createTestProfile(testUserId, { name: 'Profile 2', isDefault: false });

      await repository.unsetAllDefaults(testUserId);

      const profiles = await repository.findAllByUserId(testUserId);
      expect(profiles.every(p => !p.isDefault)).toBe(true);
    });
  });

  describe('count', () => {
    it('should count profiles for a user', async () => {
      await createTestProfile(testUserId, { name: 'Profile 1' });
      await createTestProfile(testUserId, { name: 'Profile 2' });

      const count = await repository.count(testUserId);

      expect(count).toBe(2);
    });

    it('should return 0 when user has no profiles', async () => {
      const count = await repository.count(testUserId);

      expect(count).toBe(0);
    });
  });
});
