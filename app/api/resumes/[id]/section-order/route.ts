/**
 * API Route: PATCH /api/resumes/:id/section-order
 * Updates the section order for a resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const sectionOrderSchema = z.object({
  sectionOrder: z.array(z.string()).min(1),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate request body
    const validation = sectionOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid section order', details: validation.error },
        { status: 400 }
      );
    }

    const { sectionOrder } = validation.data;

    // Check resume ownership
    const resume = await prisma.generatedResume.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Update section order
    const updatedResume = await prisma.generatedResume.update({
      where: { id },
      data: {
        sectionOrder,
        // Clear PDF cache so it regenerates with new order
        pdfUrl: null,
      },
    });

    return NextResponse.json({
      success: true,
      sectionOrder: updatedResume.sectionOrder,
    });
  } catch (error) {
    console.error('Error updating section order:', error);
    return NextResponse.json(
      { error: 'Failed to update section order' },
      { status: 500 }
    );
  }
}
