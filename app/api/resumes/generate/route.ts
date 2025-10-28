import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { resumeService } from '@/lib/services/resume.service';
import { z } from 'zod';
import { checkRateLimit, RateLimitConfigs } from '@/lib/middleware/rate-limit-helpers';
import { SimpleCache } from '@/lib/cache/simple-cache';

// Cache for user resumes list (2 minute TTL - shorter than API keys since resumes change more frequently)
const resumesCache = new SimpleCache<Array<{
  id: string;
  jobMetadata: Record<string, unknown>;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}>>(120);

// Request validation schema
const generateResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  templateId: z.string().optional(),
});

/**
 * POST /api/resumes/generate - Generate a new resume
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per minute)
    const rateLimitCheck = await checkRateLimit(request, RateLimitConfigs.resumeGeneration);
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response!;
    }

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

  const { jobDescription, jobTitle, companyName, templateId } = validation.data;

    console.log(`\n📝 API: Resume generation request from user ${session.user.id}`);
    console.log(`   Job: ${jobTitle || 'Not specified'} at ${companyName || 'Not specified'}`);

    // Generate resume (pass templateId through if provided)
    const result = await resumeService.generateResume({
      userId: session.user.id,
      jobDescription,
      jobTitle,
      companyName,
      templateId
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

    // Invalidate cache after generating a new resume
    const cacheKey = `resumes:${session.user.id}`;
    resumesCache.delete(cacheKey);

    const response = NextResponse.json({
      success: true,
      resumeId: result.resumeId,
      resume: result.resume
    }, { status: 201 });

    return rateLimitCheck.addHeaders(response);

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

    const cacheKey = `resumes:${session.user.id}`;
    
    // Try to get from cache first
    let resumes = resumesCache.get(cacheKey);
    
    if (!resumes) {
      // Cache miss - fetch from database
      resumes = await resumeService.getUserResumes(session.user.id);
      // Store in cache
      resumesCache.set(cacheKey, resumes);
    }

    return NextResponse.json(resumes);

  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}
