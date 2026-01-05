import { PrismaClient, User, Profile, Resume, CoverLetter } from '@prisma/client';
import { getTestPrisma } from '../setup';
import { hashPassword } from '@/lib/auth/password';

interface CreateUserOptions {
  email?: string;
  password?: string;
  name?: string;
  emailVerified?: Date | null;
}

interface CreateProfileOptions {
  userId: string;
  firstName?: string;
  lastName?: string;
}

interface CreateResumeOptions {
  userId: string;
  profileId?: string;
  title?: string;
}

interface CreateCoverLetterOptions {
  userId: string;
  resumeId?: string;
  title?: string;
  content?: string;
  jobDescription?: string;
}

export async function createTestUser(
  options: CreateUserOptions = {}
): Promise<User> {
  const prisma = getTestPrisma();
  
  const email = options.email || `test-${Date.now()}-${Math.random()}@example.com`;
  const password = options.password || 'TestPassword123!';
  const hashedPassword = await hashPassword(password);
  
  return prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name: options.name || 'Test User',
    },
  });
}

export async function createTestProfile(
  options: CreateProfileOptions
): Promise<Profile> {
  const prisma = getTestPrisma();
  
  return prisma.profile.create({
    data: {
      userId: options.userId,
      name: options.firstName ? `${options.firstName} ${options.lastName || ''}`.trim() : 'John Doe',
      isDefault: false,
      isPublic: false,
    },
  });
}

export async function createTestResume(
  options: CreateResumeOptions
): Promise<Resume> {
  const prisma = getTestPrisma();
  
  const defaultMetadata = {
    jobTitle: options.title || 'Software Engineer',
    companyName: 'Test Company',
  };
  
  return prisma.resume.create({
    data: {
      userId: options.userId,
      profileId: options.profileId,
      metadata: defaultMetadata,
    },
  });
}

export async function createTestCoverLetter(
  options: CreateCoverLetterOptions
): Promise<CoverLetter> {
  const prisma = getTestPrisma();
  
  return prisma.coverLetter.create({
    data: {
      userId: options.userId,
      resumeId: options.resumeId,
      content: options.content || 'Dear Hiring Manager,\n\nI am writing to express my interest...',
      metadata: {
        jobTitle: options.title || 'Software Engineer',
        companyName: 'Example Corp',
        jobDescription: options.jobDescription || 'We are looking for a talented developer...',
      },
    },
  });
}

// Helper to create a complete test context with user, profile, and resume
export async function createFullTestContext() {
  const user = await createTestUser();
  const profile = await createTestProfile({ userId: user.id });
  const resume = await createTestResume({ userId: user.id });
  
  return { user, profile, resume };
}

// Export mock factories (for unit tests without database)
export * from './user-factory';
export * from './resume-factory';
export * from './cover-letter-factory';
export * from './profile-factory';
