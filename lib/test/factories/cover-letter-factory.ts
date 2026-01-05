import { CoverLetter } from '@prisma/client';

/**
 * Creates a mock CoverLetter object for testing
 */
export function createMockCoverLetter(overrides?: Partial<CoverLetter>): CoverLetter {
  return {
    id: 'cover-letter-123',
    userId: 'user-123',
    resumeId: 'resume-123',
    jobPostingId: null,
    content: 'Dear Hiring Manager,\n\nI am writing to express my interest in the Software Engineer position...',
    metadata: {
      jobTitle: 'Software Engineer',
      companyName: 'Example Corp',
      jobDescription: 'We are looking for a talented developer to join our team...',
    },
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/**
 * Creates multiple mock cover letters
 */
export function createMockCoverLetters(count: number, userId: string = 'user-123'): CoverLetter[] {
  return Array.from({ length: count }, (_, i) => 
    createMockCoverLetter({
      id: `cover-letter-${i + 1}`,
      userId,
      resumeId: `resume-${i + 1}`,
      metadata: {
        jobTitle: `Job Title ${i + 1}`,
        companyName: `Company ${i + 1}`,
        jobDescription: `Job description ${i + 1}`,
      },
    })
  );
}

/**
 * Creates mock cover letter data for creating a new cover letter
 */
export function createMockCoverLetterData() {
  return {
    userId: 'user-123',
    resumeId: 'resume-123',
    content: 'Dear Hiring Manager,\n\nI am writing to express my interest...',
    metadata: {
      jobTitle: 'Software Engineer',
      companyName: 'Example Corp',
      jobDescription: 'We are looking for a talented developer...',
    },
  };
}
