/**
 * Profile Detail API Routes
 * 
 * GET /api/profile/[id] - Get a specific profile
 *   - Used for initial data fetching in components
 * 
 * PATCH /api/profile/[id] - Update a profile
 *   - @deprecated Prefer using updateProfile server action from '@/app/actions/profile'
 *   - Kept for backward compatibility
 * 
 * DELETE /api/profile/[id] - Delete a profile
 *   - @deprecated Prefer using deleteProfile server action from '@/app/actions/profile'
 *   - Kept for backward compatibility
 */

import { NextResponse } from 'next/server';
import { profileService } from '@/lib/services/profile.service';
import { createApiHandler } from '@/lib/api-handler';
import { updateProfileSchema } from '@/lib/validations/api-schemas';

export const GET = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  return profileService.getProfileById(id, session.user.id);
});

export const PATCH = createApiHandler(
  async (request, { params }, session, body) => {
    const { id } = await params;
    return profileService.updateProfile(id, session.user.id, body!);
  },
  { bodySchema: updateProfileSchema, verifyUser: true }
);

export const DELETE = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await profileService.deleteProfile(id, session.user.id);

  // Backward compatibility: return { success: true } on success
  if (result.success) {
    return NextResponse.json({ success: true });
  }

  return result;
});
