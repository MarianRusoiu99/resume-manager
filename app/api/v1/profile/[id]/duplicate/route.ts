/**
 * Profile Duplicate API Route
 * 
 * POST /api/profile/[id]/duplicate - Duplicate a profile
 *   - @deprecated Prefer using duplicateProfile server action from '@/app/actions/profile'
 *   - Kept for backward compatibility
 */

import { profileService } from '@/lib/services/profile.service';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api-handler';

const duplicateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const POST = createApiHandler(
  async (_request, { params }, session, body) => {
    const { id } = await params;

    return profileService.duplicateProfile(id, session.user.id, body?.name);
  },
  { bodySchema: duplicateSchema }
);
