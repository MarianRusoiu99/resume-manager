import { describe, it, expect } from 'vitest';
import {
  resumeSchema,
  type Resume,
  type Basics,
  type Work,
  type Education,
  type Skill,
} from '../index';

describe('JSON Resume Schema Validation', () => {
  describe('Complete Resume Validation', () => {
    it('should validate a complete valid resume', () => {
      const validResume: Resume = {
        $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
        basics: {
          name: 'John Doe',
          label: 'Software Engineer',
          email: 'john@example.com',
          phone: '+1-555-0100',
          url: 'https://johndoe.com',
          summary: 'Experienced software engineer',
          location: {
            address: '123 Main St',
            city: 'San Francisco',
            region: 'CA',
            postalCode: '94102',
            countryCode: 'US',
          },
          profiles: [
            {
              network: 'LinkedIn',
              username: 'johndoe',
              url: 'https://linkedin.com/in/johndoe',
            },
            {
              network: 'GitHub',
              username: 'johndoe',
              url: 'https://github.com/johndoe',
            },
          ],
        },
        work: [
          {
            name: 'Tech Corp',
            position: 'Senior Developer',
            url: 'https://techcorp.com',
            startDate: '2020-01',
            endDate: '2023-12',
            summary: 'Led development team',
            highlights: [
              'Increased performance by 50%',
              'Mentored 5 junior developers',
            ],
          },
        ],
        education: [
          {
            institution: 'University of Technology',
            url: 'https://utech.edu',
            area: 'Computer Science',
            studyType: 'Bachelor',
            startDate: '2016-09',
            endDate: '2020-05',
            score: '3.8',
            courses: ['Data Structures', 'Algorithms'],
          },
        ],
        skills: [
          {
            name: 'Programming',
            level: 'Expert',
            keywords: ['JavaScript', 'TypeScript', 'Python'],
          },
        ],
        meta: {
          version: 'v1.0.0',
          lastModified: '2024-01-01',
        },
      };

      const result = resumeSchema.safeParse(validResume);
      expect(result.success).toBe(true);
    });

    it('should validate minimal resume with only optional fields', () => {
      const minimalResume: Resume = {};
      const result = resumeSchema.safeParse(minimalResume);
      expect(result.success).toBe(true);
    });

    it('should validate resume with single section', () => {
      const resumeWithBasics: Resume = {
        basics: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      };
      const result = resumeSchema.safeParse(resumeWithBasics);
      expect(result.success).toBe(true);
    });
  });

  describe('Basics Section', () => {
    it('should validate valid basics object', () => {
      const validBasics: Basics = {
        name: 'John Doe',
        label: 'Developer',
        email: 'john@example.com',
        phone: '+1-555-0100',
        url: 'https://example.com',
        summary: 'A developer',
      };

      const resume: Resume = { basics: validBasics };
      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const resume: Resume = {
        basics: {
          email: 'invalid-email',
        },
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject invalid URL format', () => {
      const resume: Resume = {
        basics: {
          url: 'not-a-url',
        },
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('url');
      }
    });

    it('should validate location object', () => {
      const resume: Resume = {
        basics: {
          location: {
            address: '123 Main St',
            city: 'San Francisco',
            region: 'CA',
            postalCode: '94102',
            countryCode: 'US',
          },
        },
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should validate profiles array', () => {
      const resume: Resume = {
        basics: {
          profiles: [
            {
              network: 'LinkedIn',
              username: 'johndoe',
              url: 'https://linkedin.com/in/johndoe',
            },
          ],
        },
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should reject invalid profile URL', () => {
      const resume: Resume = {
        basics: {
          profiles: [
            {
              network: 'LinkedIn',
              url: 'invalid-url',
            },
          ],
        },
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(false);
    });
  });

  describe('Work Section', () => {
    it('should validate valid work entry', () => {
      const validWork: Work = {
        name: 'Tech Corp',
        position: 'Senior Developer',
        url: 'https://techcorp.com',
        startDate: '2020-01',
        endDate: '2023-12',
        summary: 'Led development team',
        highlights: ['Achievement 1', 'Achievement 2'],
      };

      const resume: Resume = { work: [validWork] };
      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should validate work with full date format (YYYY-MM-DD)', () => {
      const resume: Resume = {
        work: [
          {
            name: 'Tech Corp',
            startDate: '2020-01-15',
            endDate: '2023-12-31',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should validate work with year-month format (YYYY-MM)', () => {
      const resume: Resume = {
        work: [
          {
            name: 'Tech Corp',
            startDate: '2020-01',
            endDate: '2023-12',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should validate work with year-only format (YYYY)', () => {
      const resume: Resume = {
        work: [
          {
            name: 'Tech Corp',
            startDate: '2020',
            endDate: '2023',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const resume: Resume = {
        work: [
          {
            name: 'Tech Corp',
            startDate: '01/15/2020',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(false);
    });

    it('should reject invalid work URL', () => {
      const resume: Resume = {
        work: [
          {
            name: 'Tech Corp',
            url: 'not-a-url',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(false);
    });
  });

  describe('Education Section', () => {
    it('should validate valid education entry', () => {
      const validEducation: Education = {
        institution: 'University of Technology',
        url: 'https://utech.edu',
        area: 'Computer Science',
        studyType: 'Bachelor',
        startDate: '2016-09',
        endDate: '2020-05',
        score: '3.8',
        courses: ['Data Structures', 'Algorithms'],
      };

      const resume: Resume = { education: [validEducation] };
      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should validate education with minimal fields', () => {
      const resume: Resume = {
        education: [
          {
            institution: 'University',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should reject invalid education URL', () => {
      const resume: Resume = {
        education: [
          {
            institution: 'University',
            url: 'invalid-url',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(false);
    });
  });

  describe('Skills Section', () => {
    it('should validate valid skill entry', () => {
      const validSkill: Skill = {
        name: 'Programming',
        level: 'Expert',
        keywords: ['JavaScript', 'TypeScript', 'Python'],
      };

      const resume: Resume = { skills: [validSkill] };
      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should validate skill with minimal fields', () => {
      const resume: Resume = {
        skills: [
          {
            name: 'Programming',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });
  });

  describe('Volunteer Section', () => {
    it('should validate valid volunteer entry', () => {
      const resume: Resume = {
        volunteer: [
          {
            organization: 'Code for Good',
            position: 'Mentor',
            url: 'https://codeforgood.org',
            startDate: '2021-01',
            endDate: '2022-12',
            summary: 'Mentored students',
            highlights: ['Taught 20 students', 'Organized workshops'],
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });
  });

  describe('Awards Section', () => {
    it('should validate valid award entry', () => {
      const resume: Resume = {
        awards: [
          {
            title: 'Employee of the Year',
            date: '2022-12-01',
            awarder: 'Tech Corp',
            summary: 'Recognized for outstanding performance',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should allow string date format for awards', () => {
      const resume: Resume = {
        awards: [
          {
            title: 'Best Developer',
            date: 'December 2022',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });
  });

  describe('Certificates Section', () => {
    it('should validate valid certificate entry', () => {
      const resume: Resume = {
        certificates: [
          {
            name: 'AWS Certified Developer',
            date: '2023-06-15',
            issuer: 'Amazon Web Services',
            url: 'https://aws.amazon.com/certification',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should allow string date format for certificates', () => {
      const resume: Resume = {
        certificates: [
          {
            name: 'Certification',
            date: 'June 2023',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });
  });

  describe('Publications Section', () => {
    it('should validate valid publication entry', () => {
      const resume: Resume = {
        publications: [
          {
            name: 'Understanding Algorithms',
            publisher: 'Tech Press',
            releaseDate: '2022-03',
            url: 'https://techpress.com/algorithms',
            summary: 'A comprehensive guide',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });
  });

  describe('Languages Section', () => {
    it('should validate valid language entry', () => {
      const resume: Resume = {
        languages: [
          {
            language: 'English',
            fluency: 'Native',
          },
          {
            language: 'Spanish',
            fluency: 'Professional',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });
  });

  describe('Interests Section', () => {
    it('should validate valid interest entry', () => {
      const resume: Resume = {
        interests: [
          {
            name: 'Technology',
            keywords: ['AI', 'Machine Learning', 'Blockchain'],
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });
  });

  describe('References Section', () => {
    it('should validate valid reference entry', () => {
      const resume: Resume = {
        references: [
          {
            name: 'Jane Smith',
            reference: 'John is an excellent developer',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });
  });

  describe('Projects Section', () => {
    it('should validate valid project entry', () => {
      const resume: Resume = {
        projects: [
          {
            name: 'Open Source Library',
            description: 'A useful library',
            highlights: ['1000+ stars', 'Used by major companies'],
            keywords: ['JavaScript', 'Open Source'],
            startDate: '2021-01',
            endDate: '2023-12',
            url: 'https://github.com/user/project',
          },
        ],
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });
  });

  describe('Meta Section', () => {
    it('should validate valid meta object', () => {
      const resume: Resume = {
        meta: {
          canonical: 'https://example.com/resume.json',
          version: 'v1.0.0',
          lastModified: '2024-01-01',
        },
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should allow custom fields in meta using passthrough', () => {
      const resume = {
        meta: {
          version: 'v1.0.0',
          customField: 'custom value',
        },
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(true);
    });

    it('should reject invalid canonical URL', () => {
      const resume: Resume = {
        meta: {
          canonical: 'not-a-url',
        },
      };

      const result = resumeSchema.safeParse(resume);
      expect(result.success).toBe(false);
    });
  });

  describe('ISO8601 Date Validation', () => {
    it('should accept YYYY format', () => {
      const resume: Resume = {
        work: [{ name: 'Company', startDate: '2020' }],
      };
      expect(resumeSchema.safeParse(resume).success).toBe(true);
    });

    it('should accept YYYY-MM format', () => {
      const resume: Resume = {
        work: [{ name: 'Company', startDate: '2020-01' }],
      };
      expect(resumeSchema.safeParse(resume).success).toBe(true);
    });

    it('should accept YYYY-MM-DD format', () => {
      const resume: Resume = {
        work: [{ name: 'Company', startDate: '2020-01-15' }],
      };
      expect(resumeSchema.safeParse(resume).success).toBe(true);
    });

    it('should reject invalid year', () => {
      const resume: Resume = {
        work: [{ name: 'Company', startDate: '999' }],
      };
      expect(resumeSchema.safeParse(resume).success).toBe(false);
    });

    it('should reject invalid month', () => {
      const resume: Resume = {
        work: [{ name: 'Company', startDate: '2020-13' }],
      };
      expect(resumeSchema.safeParse(resume).success).toBe(false);
    });

    it('should reject invalid day', () => {
      const resume: Resume = {
        work: [{ name: 'Company', startDate: '2020-01-32' }],
      };
      expect(resumeSchema.safeParse(resume).success).toBe(false);
    });

    it('should reject non-ISO8601 format', () => {
      const resume: Resume = {
        work: [{ name: 'Company', startDate: '01/15/2020' }],
      };
      expect(resumeSchema.safeParse(resume).success).toBe(false);
    });
  });
});
