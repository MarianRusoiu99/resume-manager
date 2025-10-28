/**
 * Cover Letter PDF Export API
 * POST /api/cover-letter/export-pdf
 * 
 * Generates a PDF for a standalone cover letter
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { z } from 'zod';
import { profileService } from '@/lib/services/profile.service';
import { pdfService } from '@/lib/services/pdf.service';

// Validation schema
const exportPDFSchema = z.object({
  coverLetter: z.string().min(1, 'Cover letter content is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  companyName: z.string().min(1, 'Company name is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = exportPDFSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { coverLetter, jobTitle, companyName } = validationResult.data;

    // Get user's profile for personal info
    const profileResult = await profileService.getProfile(session.user.email);
    if (!profileResult.data) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      );
    }

    const profile = profileResult.data;
    if (!profile || typeof profile !== 'object' || !('personalInfo' in profile)) {
      return NextResponse.json(
        { error: 'Invalid profile data' },
        { status: 400 }
      );
    }

    const personalInfo = profile.personalInfo as {
      name: string;
      email: string;
      phone?: string;
      location?: string;
    };

    // Generate PDF using pdf service
    const pdfBuffer = await pdfService.generateCoverLetterBuffer(
      coverLetter,
      personalInfo.name,
      personalInfo.email,
      personalInfo.phone,
      jobTitle,
      companyName
    );

    // Return PDF as download
    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cover-letter-${companyName.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
      },
    });

  } catch (error) {
    console.error('[Cover Letter PDF Export] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate PDF' 
      },
      { status: 500 }
    );
  }
}
