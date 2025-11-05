/**
 * Cover Letter Detail API
 * GET /api/cover-letters/[id] - Get a specific cover letter
 * PUT /api/cover-letters/[id] - Update a cover letter
 * DELETE /api/cover-letters/[id] - Delete a cover letter
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { coverLetterService } from '@/lib/services/cover-letter.service';
import { z } from 'zod';

const updateSchema = z.object({
  content: z.string().min(1).optional(),
  contentJson: z.string().optional(), // Yoopta editor JSON state
  jobDescription: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  resumeId: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await coverLetterService.getCoverLetter(id, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Cover letter not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Cover Letter Detail API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cover letter' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const result = await coverLetterService.updateCoverLetter(
      id,
      session.user.id,
      validation.data
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Cover letter not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Cover Letter Detail API] PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update cover letter' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await coverLetterService.deleteCoverLetter(id, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Cover letter not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Cover Letter Detail API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete cover letter' },
      { status: 500 }
    );
  }
}
