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
  email?: string;
  phone?: string;
}

interface CreateResumeOptions {
  userId: string;
  title?: string;
  data?: any;
  isActive?: boolean;
}

interface CreateCoverLetterOptions {
  userId: string;
  profileId: string;
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
      firstName: options.firstName || 'John',
      lastName: options.lastName || 'Doe',
      email: options.email || `john.doe-${Date.now()}@example.com`,
      phone: options.phone || '+1234567890',
      summary: 'Experienced professional with a passion for technology.',
      headline: 'Software Engineer',
      location: 'San Francisco, CA',
    },
  });
}

export async function createTestResume(
  options: CreateResumeOptions
): Promise<Resume> {
  const prisma = getTestPrisma();
  
  const defaultData = {
    basics: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      summary: 'Experienced software engineer',
    },
    work: [
      {
        company: 'Tech Corp',
        position: 'Senior Developer',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        summary: 'Led development of key features',
      },
    ],
    education: [
      {
        institution: 'University of Example',
        area: 'Computer Science',
        studyType: 'Bachelor',
        startDate: '2015-09-01',
        endDate: '2019-06-01',
      },
    ],
    skills: [
      {
        name: 'JavaScript',
        level: 'Expert',
        keywords: ['React', 'Node.js', 'TypeScript'],
      },
    ],
  };
  
  return prisma.resume.create({
    data: {
      userId: options.userId,
      title: options.title || 'Test Resume',
      data: options.data || defaultData,
      isActive: options.isActive ?? true,
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
      profileId: options.profileId,
      title: options.title || 'Test Cover Letter',
      content: options.content || 'Dear Hiring Manager,\n\nI am writing to express my interest...',
      jobDescription: options.jobDescription || 'We are looking for a talented developer...',
      companyName: 'Example Corp',
      position: 'Software Engineer',
    },
  });
}

// Helper to create a complete test context with user, profile, and resume
export async function createTestContext() {
  const user = await createTestUser();
  const profile = await createTestProfile({ userId: user.id });
  const resume = await createTestResume({ userId: user.id });
  
  return { user, profile, resume };
}
