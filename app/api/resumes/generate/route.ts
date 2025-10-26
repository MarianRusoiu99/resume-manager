import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { resumeService } from '@/lib/services/resume.service';
import { z } from 'zod';

// Request validation schema
const generateResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  jobTitle: z.string().optional(),
  companyName: z.string().optional()
});

/**
 * POST /api/resumes/generate - Generate a new resume
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = generateResumeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { jobDescription, jobTitle, companyName } = validation.data;

    console.log(`\n📝 API: Resume generation request from user ${session.user.id}`);
    console.log(`   Job: ${jobTitle || 'Not specified'} at ${companyName || 'Not specified'}`);

    // Generate resume
    const result = await resumeService.generateResume({
      userId: session.user.id,
      jobDescription,
      jobTitle,
      companyName
    });

    if (!result.success) {
      console.error('❌ API: Resume generation failed');
      return NextResponse.json(
        {
          error: 'Resume generation failed',
          details: result.errors
        },
        { status: 500 }
      );
    }

    console.log(`✅ API: Resume generated successfully (ID: ${result.resumeId})`);

    return NextResponse.json({
      success: true,
      resumeId: result.resumeId,
      resume: result.resume
    }, { status: 201 });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resumes/generate - Get all resumes for the user
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's resumes
    const resumes = await resumeService.getUserResumes(session.user.id);

    return NextResponse.json(resumes);

  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}
