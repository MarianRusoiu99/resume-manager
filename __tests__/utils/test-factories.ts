/**
 * Test Factories
 *
 * Factory functions for creating test data for Profile, Resume, CoverLetter, and User entities.
 * These factories provide both mock objects (for unit tests) and database-backed entities (for integration tests).
 *
 * @example
 * ```ts
 * // Unit testing with mock objects (no database required)
 * import { createMockUser, createMockProfile, createMockResume, createMockCoverLetter } from '@/__tests__/utils/test-factories';
 *
 * const user = createMockUser({ email: 'custom@example.com' });
 * const profile = createMockProfile({ userId: user.id, isDefault: true });
 * const resume = createMockResume({ userId: user.id });
 * const coverLetter = createMockCoverLetter({ userId: user.id, resumeId: resume.id });
 * ```
 *
 * @example
 * ```ts
 * // Integration testing with database entities
 * import { createTestUser, createTestProfile, createTestResume, createTestCoverLetter } from '@/__tests__/utils/test-factories';
 *
 * const user = await createTestUser({ email: 'test@example.com' });
 * const profile = await createTestProfile({ userId: user.id });
 * const resume = await createTestResume({ userId: user.id, profileId: profile.id });
 * ```
 *
 * @example
 * ```ts
 * // Create multiple mock entities
 * import { createMockUsers, createMockProfiles, createMockResumes, createMockCoverLetters } from '@/__tests__/utils/test-factories';
 *
 * const users = createMockUsers(5);
 * const profiles = createMockProfiles(3, 'user-123');
 * ```
 *
 * @example
 * ```ts
 * // Full test context with user, profile, and resume
 * import { createFullTestContext } from '@/__tests__/utils/test-factories';
 *
 * const { user, profile, resume } = await createFullTestContext();
 * ```
 *
 * @module test-factories
 */

// Re-export mock factories for unit tests (no database required)
export {
  createMockUser,
  createMockUsers,
} from '@/lib/test/factories/user-factory';

export {
  createMockProfile,
  createMockProfiles,
} from '@/lib/test/factories/profile-factory';

export {
  createMockResume,
  createMockResumes,
  createMockResumeData,
} from '@/lib/test/factories/resume-factory';

export {
  createMockCoverLetter,
  createMockCoverLetters,
  createMockCoverLetterData,
} from '@/lib/test/factories/cover-letter-factory';

// Re-export database-backed factories for integration tests
export {
  createTestUser,
  createTestProfile,
  createTestResume,
  createTestCoverLetter,
  createFullTestContext,
} from '@/lib/test/factories/index';
