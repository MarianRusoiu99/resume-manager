/**
 * Test Factories
 * 
 * Factory functions to create test data for the database
 */

import { testDb } from '../setup';
import { hashPassword } from '@/lib/auth/password';
import type { User, Profile, Resume, CoverLetter } from '@prisma/client';
import type { Resume as JsonResume } from '@/lib/validations/jsonresume';

/**
 * Create a test user with hashed password
 */
export async function createTestUser(overrides?: {
  email?: string;
  password?: string;
  name?: string;
  isAdmin?: boolean;
}): Promise<User> {
  const password = overrides?.password || 'password123';
  const passwordHash = await hashPassword(password);

  return testDb.user.create({
    data: {
      email: overrides?.email || `test-${Date.now()}@example.com`,
      passwordHash,
      name: overrides?.name || 'Test User',
      isAdmin: overrides?.isAdmin || false,
    },
  });
}

/**
 * Create a test profile with a JSON Resume document
 */
export async function createTestProfile(
  userId: string,
  overrides?: {
    name?: string;
    isDefault?: boolean;
    isPublic?: boolean;
    publicSlug?: string | null;
    selectedTemplateId?: string | null;
    resume?: JsonResume;
  }
): Promise<Profile & { document: { document: unknown } | null }> {
  const defaultResume: JsonResume = {
    basics: {
      name: 'Test User',
      label: 'Software Engineer',
      email: 'test@example.com',
      phone: '555-0100',
      url: 'https://example.com',
      summary: 'A passionate software engineer',
      location: {
        city: 'San Francisco',
        countryCode: 'US',
        region: 'California',
      },
      profiles: [],
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
  };

  const profile = await testDb.profile.create({
    data: {
      userId,
      name: overrides?.name || 'Test Profile',
      isDefault: overrides?.isDefault ?? false,
      isPublic: overrides?.isPublic ?? false,
      publicSlug: overrides?.publicSlug,
      selectedTemplateId: overrides?.selectedTemplateId,
      document: {
        create: {
          document: overrides?.resume || defaultResume,
        },
      },
    },
    include: {
      document: true,
    },
  });

  return profile;
}

/**
 * Create a test resume with document
 */
export async function createTestResume(
  userId: string,
  overrides?: {
    profileId?: string | null;
    jobPostingId?: string | null;
    templateId?: string | null;
    metadata?: Record<string, unknown>;
    resume?: JsonResume;
  }
): Promise<Resume & { document: { document: unknown } | null }> {
  const defaultResume: JsonResume = {
    basics: {
      name: 'Test User',
      label: 'Software Engineer',
      email: 'test@example.com',
      phone: '555-0100',
      url: 'https://example.com',
      summary: 'A passionate software engineer',
      location: {
        city: 'San Francisco',
        countryCode: 'US',
        region: 'California',
      },
      profiles: [],
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
  };

  const defaultMetadata = {
    title: 'Test Resume',
    generatedAt: new Date().toISOString(),
  };

  const resume = await testDb.resume.create({
    data: {
      userId,
      profileId: overrides?.profileId,
      jobPostingId: overrides?.jobPostingId,
      templateId: overrides?.templateId,
      metadata: overrides?.metadata || defaultMetadata,
      document: {
        create: {
          document: overrides?.resume || defaultResume,
        },
      },
    },
    include: {
      document: true,
    },
  });

  return resume;
}

/**
 * Create a test cover letter
 */
export async function createTestCoverLetter(
  userId: string,
  overrides?: {
    resumeId?: string | null;
    jobPostingId?: string | null;
    content?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<CoverLetter> {
  const defaultContent = `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at your company.

With over 5 years of experience in software development, I have developed a strong foundation in building scalable web applications and solving complex technical challenges.

I am excited about the opportunity to contribute to your team and look forward to discussing how my skills and experience align with your needs.

Sincerely,
Test User`;

  const defaultMetadata = {
    generatedAt: new Date().toISOString(),
    tone: 'professional',
  };

  return testDb.coverLetter.create({
    data: {
      userId,
      resumeId: overrides?.resumeId,
      jobPostingId: overrides?.jobPostingId,
      content: overrides?.content || defaultContent,
      metadata: overrides?.metadata || defaultMetadata,
    },
  });
}

/**
 * Create a test resume template
 */
export async function createTestTemplate(overrides?: {
  name?: string;
  description?: string;
  htmlTemplate?: string;
  previewUrl?: string;
  isPublic?: boolean;
}) {
  const defaultHtmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>{{basics.name}} - Resume</title>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{basics.name}}</h1>
    <p>{{basics.label}}</p>
  </div>
</body>
</html>
  `.trim();

  return testDb.resumeTemplate.create({
    data: {
      name: overrides?.name || 'Test Template',
      description: overrides?.description || 'A test template for resumes',
      htmlTemplate: overrides?.htmlTemplate || defaultHtmlTemplate,
      previewUrl: overrides?.previewUrl,
      isPublic: overrides?.isPublic ?? true,
    },
  });
}

/**
 * Create a test company
 */
export async function createTestCompany(overrides?: {
  name?: string;
}) {
  return testDb.company.create({
    data: {
      name: overrides?.name || 'Test Company Inc.',
    },
  });
}

/**
 * Create a test job posting
 */
export async function createTestJobPosting(
  userId: string,
  overrides?: {
    companyId?: string | null;
    title?: string;
    sourceUrl?: string;
    postedAt?: Date;
    description?: string;
  }
) {
  const defaultDescription = `We are looking for a talented Software Engineer to join our team.

Responsibilities:
- Design and develop scalable web applications
- Collaborate with cross-functional teams
- Write clean, maintainable code

Requirements:
- 3+ years of experience in software development
- Strong knowledge of JavaScript/TypeScript
- Experience with React and Node.js`;

  return testDb.jobPosting.create({
    data: {
      userId,
      companyId: overrides?.companyId,
      title: overrides?.title || 'Software Engineer',
      sourceUrl: overrides?.sourceUrl,
      postedAt: overrides?.postedAt,
      description: overrides?.description || defaultDescription,
    },
  });
}
