/**
 * Profile Set Default API Route
 * 
 * POST /api/profile/[id]/set-default - Set a profile as default
 *   - @deprecated Prefer using setDefaultProfile server action from '@/app/actions/profile'
 *   - Kept for backward compatibility
 */

import { NextResponse } from 'next/server';
import { profileService } from '@/lib/services/profile.service';
import { createApiHandler } from '@/lib/api-handler';

export const POST = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await profileService.setDefaultProfile(
    id,
    session.user.id
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
});
