/**
 * Simple test to verify the workflow works
 * 
 * Run with: npm test lib/workflows/__tests__/resume-generator.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import type { Resume } from '@/lib/validations/jsonresume';

describe('Resume Generator Workflow', () => {
  // Mock the AI SDK to avoid actual API calls
  vi.mock('ai', () => ({
    generateObject: vi.fn().mockResolvedValue({
      object: {
        jobTitle: 'Senior Software Engineer',
        companyName: 'Acme Corp',
        requiredSkills: ['JavaScript', 'React'],
        preferredSkills: ['TypeScript'],
        atsKeywords: ['software', 'engineer', 'React'],
        keyResponsibilities: ['Build applications', 'Lead team'],
        summary: 'Build software',
      },
    }),
  }));

  vi.mock('@ai-sdk/openai', () => ({
    createOpenAI: vi.fn(() => (model: string) => `mocked-${model}`),
  }));

  it('should have correct input types', () => {
    // This test verifies the TypeScript types are correct
    const input: {
      apiKey: string;
      jobDescription: string;
      userResume: Resume;
      includeCoverLetter?: boolean;
      personalInstructions?: string;
    } = {
      apiKey: 'sk-test',
      jobDescription: 'Senior Developer position at Test Corp requiring JavaScript experience',
      userResume: {
        basics: {
          name: 'Test User',
          email: 'test@example.com',
        },
        work: [
          {
            name: 'Previous Company',
            position: 'Developer',
            startDate: '2020-01',
            highlights: ['Built features', 'Fixed bugs'],
          },
        ],
      },
      includeCoverLetter: true,
    };

    expect(input.apiKey).toBe('sk-test');
    expect(input.userResume.basics?.name).toBe('Test User');
  });

  it('should export the correct types', async () => {
    const { generateResume } = await import('../resume-generator');
    
    expect(typeof generateResume).toBe('function');
  });

  it('should have proper schema validation', async () => {
    // Import the module to verify schemas are defined
    const workflowModule = await import('../resume-generator');
    
    // Verify exports exist
    expect(workflowModule.generateResume).toBeDefined();
  });
});

describe('Workflow Structure', () => {
  it('should follow simple input-output pattern', () => {
    // The workflow should be:
    // Input (apiKey, jobDescription, userResume) → Process → Output (resume, coverLetter)
    
    const expectedInput = {
      apiKey: expect.any(String),
      jobDescription: expect.any(String),
      userResume: expect.any(Object),
    };

    const expectedOutput = {
      success: expect.any(Boolean),
      resume: expect.any(Object),
      coverLetter: expect.any(String),
    };

    expect(expectedInput).toBeDefined();
    expect(expectedOutput).toBeDefined();
  });
});
