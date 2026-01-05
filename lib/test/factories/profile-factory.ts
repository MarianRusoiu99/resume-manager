import { Profile } from '@prisma/client';

/**
 * Creates a mock Profile object for testing
 */
export function createMockProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: 'profile-123',
    userId: 'user-123',
    name: 'Test Profile',
    isDefault: false,
    isPublic: false,
    publicSlug: null,
    selectedTemplateId: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/**
 * Creates multiple mock profiles
 */
export function createMockProfiles(count: number, userId: string = 'user-123'): Profile[] {
  return Array.from({ length: count }, (_, i) => 
    createMockProfile({
      id: `profile-${i + 1}`,
      userId,
      name: `Profile ${i + 1}`,
      isDefault: i === 0, // First profile is default
    })
  );
}
