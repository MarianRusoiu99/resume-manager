import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { resumeService } from '@/lib/services/resume.service';
import { resumesCache } from '@/lib/cache/resumes-cache';

/**
 * GET /api/resume/[id] - Get a specific resume
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Get resume (with ownership verification)
    const resume = await resumeService.getResume(id, session.user.id);

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(resume);

  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resume/[id] - Delete a specific resume
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Delete resume (with ownership verification)
    await resumeService.deleteResume(id, session.user.id);

    // Invalidate cache after deleting a resume
    const cacheKey = `resumes:${session.user.id}`;
    resumesCache.delete(cacheKey);

    return NextResponse.json(
      { success: true, message: 'Resume deleted successfully' }
    );

  } catch (error) {
    console.error('Error deleting resume:', error);
    
    // Check if it's a not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/resume/[id] - Update resume content or template
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // Handle template update separately if only templateId is provided
    if (body.templateId !== undefined && !body.resume) {
      const updatedResume = await resumeService.updateResumeTemplate(
        id,
        session.user.id,
        body.templateId
      );

      // Invalidate cache after updating
      const cacheKey = `resumes:${session.user.id}`;
      resumesCache.delete(cacheKey);

      return NextResponse.json(updatedResume);
    }

    // Update the resume content
    const updatedResume = await resumeService.updateResumeContent(
      id,
      session.user.id,
      body.resume
    );

    // Invalidate cache after updating
    const cacheKey = `resumes:${session.user.id}`;
    resumesCache.delete(cacheKey);

    return NextResponse.json(updatedResume);

  } catch (error) {
    console.error('Error updating resume:', error);
    
    // Check if it's a not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}
