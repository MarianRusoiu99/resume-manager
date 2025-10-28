/**
 * Integration Tests for Section Order API
 * Tests the PATCH /api/resumes/:id/section-order endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/resumes/[id]/section-order/route';

// Mock dependencies
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    generatedResume: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

describe('PATCH /api/resumes/:id/section-order', () => {
  const mockUserId = 'test-user-123';
  const mockResumeId = 'resume-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock no session
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/resumes/resume-456/section-order', {
      method: 'PATCH',
      body: JSON.stringify({ sectionOrder: ['summary', 'experience'] }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockResumeId }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if sectionOrder is invalid', async () => {
    // Mock authenticated session
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    });

    const request = new NextRequest('http://localhost:3000/api/resumes/resume-456/section-order', {
      method: 'PATCH',
      body: JSON.stringify({ sectionOrder: [] }), // Empty array is invalid
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockResumeId }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid section order');
  });

  it('should return 404 if resume does not exist', async () => {
    // Mock authenticated session
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    });

    // Mock resume not found
    vi.mocked(prisma.generatedResume.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/resumes/resume-456/section-order', {
      method: 'PATCH',
      body: JSON.stringify({ sectionOrder: ['summary', 'experience'] }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockResumeId }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Resume not found');
  });

  it('should successfully update section order', async () => {
    const newSectionOrder = ['experience', 'summary', 'education', 'skills'];

    // Mock authenticated session
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: mockUserId, email: 'test@example.com' },
    });

    // Mock resume found
    // @ts-expect-error - Partial mock for test purposes
    vi.mocked(prisma.generatedResume.findFirst).mockResolvedValue({
      id: mockResumeId,
      userId: mockUserId,
      sectionOrder: null,
    });

    // Mock successful update
    // @ts-expect-error - Partial mock for test purposes
    vi.mocked(prisma.generatedResume.update).mockResolvedValue({
      id: mockResumeId,
      sectionOrder: newSectionOrder,
      pdfUrl: null, // Should be cleared
    });

    const request = new NextRequest('http://localhost:3000/api/resumes/resume-456/section-order', {
      method: 'PATCH',
      body: JSON.stringify({ sectionOrder: newSectionOrder }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockResumeId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.sectionOrder).toEqual(newSectionOrder);

    // Verify prisma calls
    expect(prisma.generatedResume.findFirst).toHaveBeenCalledWith({
      where: {
        id: mockResumeId,
        userId: mockUserId,
      },
    });

    expect(prisma.generatedResume.update).toHaveBeenCalledWith({
      where: { id: mockResumeId },
      data: {
        sectionOrder: newSectionOrder,
        pdfUrl: null,
      },
    });
  });

  it('should verify resume ownership before updating', async () => {
    const differentUserId = 'different-user-789';

    // Mock authenticated session with different user
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: differentUserId, email: 'other@example.com' },
    });

    // Mock resume owned by different user (findFirst returns null)
    vi.mocked(prisma.generatedResume.findFirst).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/resumes/resume-456/section-order', {
      method: 'PATCH',
      body: JSON.stringify({ sectionOrder: ['summary', 'experience'] }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mockResumeId }),
    });

    expect(response.status).toBe(404);
    expect(prisma.generatedResume.update).not.toHaveBeenCalled();
  });
});
