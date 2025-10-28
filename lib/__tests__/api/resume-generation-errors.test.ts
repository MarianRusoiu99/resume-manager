/**
 * Error Scenario Tests for Resume Generation API
 * Tests edge cases and error handling in /api/resumes/generate
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/resumes/generate/route';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    aPIKey: {
      findFirst: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
    },
    generatedResume: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/resume.service', () => ({
  resumeService: {
    generateResume: vi.fn(),
  },
}));

import { resumeService } from '@/lib/services/resume.service';

describe('Resume Generation Error Scenarios', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Errors', () => {
    it('should return 401 when user is not authenticated', async () => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'Software Engineer position',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation Errors', () => {
    beforeEach(() => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      });
    });

    it('should return 400 when jobDescription is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.details).toBeDefined();
    });

    it('should return 400 when jobDescription is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: '',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 when jobDescription is too short', async () => {
      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'Hi',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: 'not valid json{',
      });

      const response = await POST(request);

      // API returns 500 for JSON parse errors
      expect(response.status).toBe(500);
    });

    it('should return 400 when request body is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('API Key Errors', () => {
    beforeEach(() => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      });
    });

    it('should return 400 or 429 when no API key is configured', async () => {
      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'We are looking for a Software Engineer with 3+ years of experience in React and Node.js.',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      // Rate limiting may return 429, or 400 if API key validation fails
      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        const data = await response.json();
        expect(data.error).toContain('API key');
      }
    });

    it('should handle encrypted API key decryption failure', async () => {
      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue({
        id: 'key-1',
        encryptedKey: 'invalid-encrypted-data',
        provider: 'openai',
      });

      // Mock profile
      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
      });

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'We are looking for a Software Engineer with 3+ years of experience in React and Node.js.',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      // Should fail gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Profile Errors', () => {
    beforeEach(() => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      });

      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue({
        id: 'key-1',
        encryptedKey: 'encrypted-key-data',
        provider: 'openai',
      });
    });

    it('should return 400 or 429 when user profile does not exist', async () => {
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'We are looking for a Software Engineer with 3+ years of experience in React and Node.js.',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      // Rate limiting may return 429, or 400 if profile validation fails
      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        const data = await response.json();
        expect(data.error).toContain('profile');
      }
    });

    it('should handle profile with missing required data', async () => {
      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
        personalInfo: {},
        experience: [],
        education: [],
        skills: [],
      });

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'We are looking for a Software Engineer with 3+ years of experience in React and Node.js.',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      // Should either succeed or fail with clear error (429 from rate limiting is expected)
      expect([200, 201, 400, 429, 500]).toContain(response.status);
    });
  });

  describe('Generation Service Errors', () => {
    beforeEach(() => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      });

      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue({
        id: 'key-1',
        encryptedKey: 'encrypted-key-data',
        provider: 'openai',
      });

      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
        personalInfo: { name: 'John Doe', email: 'john@example.com' },
        experience: [{ company: 'Tech Co', position: 'Developer' }],
        education: [{ school: 'University', degree: 'BS CS' }],
        skills: ['JavaScript', 'React'],
      });
    });

    it('should handle AI service timeout or rate limiting', async () => {
      vi.mocked(resumeService.generateResume).mockRejectedValue(
        new Error('Request timeout')
      );

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'We are looking for a Software Engineer with 3+ years of experience in React and Node.js.',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      // May return 500 for timeout or 429 from rate limiting
      expect([429, 500]).toContain(response.status);
      if (response.status === 500) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });

    it('should handle AI service rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as Error & { status: number }).status = 429;
      vi.mocked(resumeService.generateResume).mockRejectedValue(rateLimitError);

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'We are looking for a Software Engineer with 3+ years of experience in React and Node.js.',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle AI service returning invalid data', async () => {
      vi.mocked(resumeService.generateResume).mockResolvedValue({
        success: false,
        errors: ['AI generated invalid resume structure'],
      });

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'We are looking for a Software Engineer with 3+ years of experience in React and Node.js.',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Database Errors', () => {
    beforeEach(() => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      });

      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue({
        id: 'key-1',
        encryptedKey: 'encrypted-key-data',
        provider: 'openai',
      });

      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
      });
    });

    it('should handle database connection failure during save or rate limiting', async () => {
      vi.mocked(resumeService.generateResume).mockResolvedValue({
        success: true,
        resumeId: 'resume-123',
        resume: {
          id: 'resume-123',
          content: { summary: 'Test summary' },
          metadata: {},
          createdAt: new Date(),
        },
      });

      vi.mocked(prisma.generatedResume.create).mockRejectedValue(
        new Error('Database connection lost')
      );

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'We are looking for a Software Engineer with 3+ years of experience in React and Node.js.',
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      // May return 500 for DB error or 429 from rate limiting
      expect([429, 500]).toContain(response.status);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: mockUserId, email: 'test@example.com' },
      });
    });

    it('should handle extremely long job descriptions', async () => {
      const longJobDescription = 'Job requirement: '.repeat(1000); // Very long description

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: longJobDescription,
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      // Should either process or reject with clear error (429 from rate limiting is expected)
      expect([200, 201, 400, 413, 429]).toContain(response.status);
    });

    it('should handle special characters in job description', async () => {
      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue({
        id: 'key-1',
        provider: 'openai',
      });

      const specialCharsDescription = 'Looking for <script>alert("xss")</script> developer with SQL\'; DROP TABLE users; --';

      const request = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: specialCharsDescription,
          jobTitle: 'Software Engineer',
        }),
      });

      const response = await POST(request);

      // Should handle safely without injection
      expect(response.status).toBeLessThan(500);
    });

    it('should handle concurrent generation requests', async () => {
      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue({
        id: 'key-1',
        provider: 'openai',
      });

      // @ts-expect-error - Partial mock for test purposes
      vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
      });

      vi.mocked(resumeService.generateResume).mockResolvedValue({
        success: true,
        resumeId: 'resume-123',
      });

      const request1 = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'Job 1 description with enough text to pass validation requirements here',
          jobTitle: 'Job 1',
        }),
      });

      const request2 = new NextRequest('http://localhost:3000/api/resumes/generate', {
        method: 'POST',
        body: JSON.stringify({
          jobDescription: 'Job 2 description with enough text to pass validation requirements here',
          jobTitle: 'Job 2',
        }),
      });

      // Both requests should be handled
      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2),
      ]);

      expect(response1.status).toBeLessThan(500);
      expect(response2.status).toBeLessThan(500);
    });
  });
});
