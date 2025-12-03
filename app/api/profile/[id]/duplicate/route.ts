/**
 * Profile Duplicate API Route
 * 
 * POST /api/profile/[id]/duplicate - Duplicate a profile
 *   - @deprecated Prefer using duplicateProfile server action from '@/app/actions/profile'
 *   - Kept for backward compatibility
 */

import { NextResponse } from 'next/server';
import { profileService } from '@/lib/services/profile.service';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api-handler';

const duplicateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const POST = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const body = await request.json();
  const validation = duplicateSchema.safeParse(body);

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

  const result = await profileService.duplicateProfile(
    id,
    session.user.id,
    validation.data.name
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result.data, { status: 201 });
});
