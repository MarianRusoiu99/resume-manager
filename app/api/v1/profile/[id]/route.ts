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

import { profileService } from '@/lib/services';
import { createApiHandler } from '@/lib/api/handler';
import { updateProfileSchema } from '@/lib/validations/api-schemas';
import { success } from '@/lib/types/service-result';

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

  if (!result.success) {
    return result;
  }

  // Backward-compatible payload for callers that ignore the body
  return success({ success: true });
});
