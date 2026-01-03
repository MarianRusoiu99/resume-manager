/**
 * AI Agents Schema Tests
 * 
 * Tests for AI agent schemas validation
 */

import { describe, it, expect } from 'vitest';
import { optimizedResumeSchema } from '../agents/resume-optimization/agent';
import { mockOptimizedResume, mockResume } from './mocks';

describe('Resume Optimization Agent Schema', () => {
  describe('optimizedResumeSchema', () => {
    it('validates a complete optimized resume', () => {
      const result = optimizedResumeSchema.safeParse(mockOptimizedResume.resume);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.basics?.name).toBe('John Doe');
        expect(result.data.basics?.label).toBe('Full Stack Software Engineer');
      }
    });

    it('validates resume with all optional sections', () => {
      const fullResume = {
        basics: {
          name: 'John Doe',
          label: 'Engineer',
          email: 'john@example.com',
          summary: 'Summary text',
        },
        work: [{
          name: 'Company',
          position: 'Developer',
          startDate: '2020-01',
          highlights: ['Did something'],
        }],
        education: [{
          institution: 'University',
          area: 'CS',
          studyType: 'BS',
        }],
        skills: [{
          name: 'JavaScript',
          level: 'Expert',
          keywords: ['React', 'Node.js'],
        }],
        projects: [{
          name: 'Project',
          description: 'A project',
        }],
        certificates: [{
          name: 'AWS Certified',
          issuer: 'Amazon',
        }],
        languages: [{
          language: 'English',
          fluency: 'Native',
        }],
        volunteer: [{
          organization: 'Org',
          position: 'Volunteer',
        }],
        awards: [{
          title: 'Award',
          awarder: 'Awarder',
        }],
        publications: [{
          name: 'Paper',
          publisher: 'Journal',
        }],
        interests: [{
          name: 'Coding',
          keywords: ['Open Source'],
        }],
        references: [{
          name: 'Reference',
          reference: 'Great person',
        }],
      };

      const result = optimizedResumeSchema.safeParse(fullResume);
      expect(result.success).toBe(true);
    });

    it('validates empty resume object', () => {
      const result = optimizedResumeSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('validates resume with partial data', () => {
      const partialResume = {
        basics: {
          name: 'Jane',
        },
        skills: [],
      };

      const result = optimizedResumeSchema.safeParse(partialResume);
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const resumeWithExtras = {
        basics: {
          name: 'John',
          customField: 'custom value',
        },
        customSection: 'extra data',
      };

      const result = optimizedResumeSchema.safeParse(resumeWithExtras);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).customSection).toBe('extra data');
      }
    });

    it('validates work experience highlights as string array', () => {
      const resume = {
        work: [{
          name: 'Company',
          position: 'Dev',
          highlights: ['Highlight 1', 'Highlight 2', 'Highlight 3'],
        }],
      };

      const result = optimizedResumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.work?.[0].highlights).toHaveLength(3);
      }
    });

    it('rejects invalid data types', () => {
      const invalidResume = {
        basics: {
          name: 123, // Should be string
        },
      };

      const result = optimizedResumeSchema.safeParse(invalidResume);
      expect(result.success).toBe(false);
    });

    it('rejects skills with non-string keywords', () => {
      const invalidResume = {
        skills: [{
          name: 'JavaScript',
          keywords: [1, 2, 3], // Should be strings
        }],
      };

      const result = optimizedResumeSchema.safeParse(invalidResume);
      expect(result.success).toBe(false);
    });
  });
});
