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

export const POST = createApiHandler(
  async (request, { params }, session, body) => {
    const { id } = await params;

    const result = await profileService.duplicateProfile(
      id,
      session.user.id,
      body?.name
    );

    if (!result.success) {
      // ServiceResult already has proper error codes, but for 201 status we need custom handling
      return result;
    }

    return NextResponse.json(result.data, { status: 201 });
  },
  { bodySchema: duplicateSchema }
);
