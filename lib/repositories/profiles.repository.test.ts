import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileRepository } from './profiles.repository';
import { createTestUser } from '@/lib/test/factories';
import { getTestPrisma, shouldSkipDatabaseTests } from '@/lib/test/setup';

describe.skipIf(shouldSkipDatabaseTests())('ProfileRepository', () => {
  let repository: ProfileRepository;
  let userId: string;

  beforeEach(async () => {
    const prisma = getTestPrisma();
    repository = new ProfileRepository(prisma);
    
    // Create a test user for each test
    const user = await createTestUser();
    userId = user.id;
  });

  it('should create a profile', async () => {
    const profileData = {
      userId,
      name: 'Test Profile',
      resume: {
        basics: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    };

    const profile = await repository.create(profileData);

    expect(profile).toBeDefined();
    expect(profile.id).toBeDefined();
    expect(profile.userId).toBe(userId);
    expect(profile.name).toBe('Test Profile');
    expect(profile.resume).toBeDefined();
    expect(profile.resume?.basics?.name).toBe('John Doe');
  });

  it('should find profile by id', async () => {
    const created = await repository.create({
      userId,
      name: 'Find Me',
      resume: { basics: { name: 'Test' } },
    });

    const found = await repository.findById(created.id, userId);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe('Find Me');
  });

  it('should update a profile', async () => {
    const created = await repository.create({
      userId,
      name: 'Original Name',
      resume: { basics: { name: 'Test' } },
    });

    const updated = await repository.update(created.id, {
      name: 'Updated Name',
    }, userId);

    expect(updated.name).toBe('Updated Name');
    expect(updated.id).toBe(created.id);
  });

  it('should delete a profile', async () => {
    const created = await repository.create({
      userId,
      name: 'Delete Me',
      resume: { basics: { name: 'Test' } },
    });

    const deleted = await repository.delete(created.id, userId);
    expect(deleted.id).toBe(created.id);

    const found = await repository.findById(created.id, userId);
    expect(found).toBeNull();
  });

  it('should find all profiles by user id', async () => {
    await repository.create({
      userId,
      name: 'Profile 1',
      resume: { basics: { name: 'Test 1' } },
    });
    
    await repository.create({
      userId,
      name: 'Profile 2',
      resume: { basics: { name: 'Test 2' } },
    });

    const profiles = await repository.findAllByUserId(userId);
    expect(profiles).toHaveLength(2);
  });
});
