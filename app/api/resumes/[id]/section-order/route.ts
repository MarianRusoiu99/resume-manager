/**
 * API Route: PATCH /api/resumes/:id/section-order
 * DEPRECATED: Section order is no longer a separate field in JSON Resume schema
 * This route is kept for backward compatibility but does nothing
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Section order is now handled within the JSON Resume structure
    // This endpoint is deprecated and returns success without doing anything
    return NextResponse.json({
      success: true,
      message: 'Section order is now part of the JSON Resume structure and does not need separate updates',
    });
  } catch (error) {
    console.error('Error in deprecated section-order endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to update section order' },
      { status: 500 }
    );
  }
}
