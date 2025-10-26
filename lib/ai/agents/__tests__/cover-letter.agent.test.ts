import { describe, it, expect, vi, beforeEach } from 'vitest';
import { coverLetterAgent } from '../cover-letter.agent';

// Mock model with invoke returning structured JSON
const fakeResponse = JSON.stringify({
  coverLetter: 'This is a test cover letter.',
  structure: {
    opening: 'Opening paragraph.',
    body: ['Body paragraph 1', 'Body paragraph 2'],
    closing: 'Closing paragraph.'
  },
  tone: 'professional',
  wordCount: 5
});

const mockModel = {
  invoke: vi.fn(async (messages: any[]) => ({ content: fakeResponse }))
};

describe('coverLetterAgent', () => {
  it('should parse structured response and return cover letter output', async () => {
    const input: any = {
      jobDescription: 'We need a strong engineer.',
      jobTitle: 'Engineer',
      companyName: 'Acme',
      jobAnalysis: {
        summary: 'Build things',
        requiredSkills: ['Engineering'],
        preferredSkills: [],
        keyResponsibilities: []
      },
      userProfile: {
        personalInfo: { name: 'Jane Doe' },
        summary: '',
        experience: [],
        education: [],
        skills: { technical: [], soft: [] }
      },
      matchingResults: { overallScore: 90, matchingSkills: [], missingSkills: [], topExperiences: [] }
    };

    const result = await coverLetterAgent(input, mockModel as any);

    expect(result.coverLetter).toContain('test cover letter');
    expect(result.structure.opening).toBe('Opening paragraph.');
    expect(result.wordCount).toBe(5);
    expect(mockModel.invoke).toHaveBeenCalled();
  });

  it('should fallback to raw content if JSON parse fails', async () => {
    // Mock model returning non-json content
    const badModel = { invoke: vi.fn(async () => ({ content: 'Plain text cover letter without JSON' })) };

    const input: any = {
      jobDescription: 'We need a strong engineer.',
      jobTitle: 'Engineer',
      companyName: 'Acme',
      jobAnalysis: {
        summary: 'Build things',
        requiredSkills: ['Engineering'],
        preferredSkills: [],
        keyResponsibilities: []
      },
      userProfile: {
        personalInfo: { name: 'Jane Doe' },
        summary: '',
        experience: [],
        education: [],
        skills: { technical: [], soft: [] }
      },
      matchingResults: { overallScore: 90, matchingSkills: [], missingSkills: [], topExperiences: [] }
    };

    const result = await coverLetterAgent(input, badModel as any);

    expect(result.coverLetter).toContain('Plain text cover letter');
  });
});
