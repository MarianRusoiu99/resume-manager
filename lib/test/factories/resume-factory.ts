import { GeneratedResumeData } from '@/lib/repositories/interfaces/generated-resumes.repository.interface';
import { Resume } from '@/lib/validations/jsonresume';

/**
 * Creates a mock Resume object for testing
 */
export function createMockResume(overrides?: Partial<GeneratedResumeData>): GeneratedResumeData {
  return {
    id: 'resume-123',
    userId: 'user-123',
    jobDescription: 'Test Job Description',
    jobMetadata: {
      jobTitle: 'Software Engineer',
      companyName: 'Test Company',
    },
    resume: {
      basics: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    } as Resume,
    templateId: 'modern',
    coverLetterId: null,
    metadata: {},
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/**
 * Creates multiple mock resumes
 */
export function createMockResumes(count: number, userId: string = 'user-123'): GeneratedResumeData[] {
  return Array.from({ length: count }, (_, i) => 
    createMockResume({
      id: `resume-${i + 1}`,
      userId,
      jobMetadata: {
        jobTitle: `Job Title ${i + 1}`,
        companyName: `Company ${i + 1}`,
      },
    })
  );
}

/**
 * Creates mock resume data for creating a new resume
 */
export function createMockResumeData() {
  return {
    userId: 'user-123',
    jobDescription: 'Test Job Description',
    jobMetadata: {
      jobTitle: 'Software Engineer',
      companyName: 'Test Company',
    },
    resume: {
      basics: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    } as Resume,
    metadata: {},
  };
}
