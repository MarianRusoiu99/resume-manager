/**
 * Profile Set Default API Route
 * 
 * POST /api/profile/[id]/set-default - Set a profile as default
 *   - @deprecated Prefer using setDefaultProfile server action from '@/app/actions/profile'
 *   - Kept for backward compatibility
 */

import { profileService } from '@/lib/services';
import { createApiHandler } from '@/lib/api/handler';
import { success } from '@/lib/types/service-result';

export const POST = createApiHandler(async (request, { params }, session) => {
  const { id } = await params;

  const result = await profileService.setDefaultProfile(
    id,
    session.user.id
  );

  if (!result.success) {
    return result;
  }

  // Backward-compatible payload shape for callers that ignore the body
  return success({ success: true });
});
