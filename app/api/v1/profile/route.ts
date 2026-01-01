/**
 * Profile API Routes
 * 
 * GET /api/profile - Get all profiles for the current user
 *   - Used for initial data fetching in components
 * 
 * POST /api/profile - Create a new profile
 *   - @deprecated Prefer using createProfile server action from '@/app/actions/profile'
 *   - Kept for backward compatibility and potential external API access
 */

import { profileService } from '@/lib/services';
import { createApiHandler } from '@/lib/api/handler';
import { createProfileSchema } from '@/lib/validations/api-schemas';

export const GET = createApiHandler(async (_request, _context, session) => {
  return profileService.getProfiles(session.user.id);
});

export const POST = createApiHandler(
  async (_request, _context, session, body) => {
    const result = await profileService.createProfile(
      session.user.id,
      body!.name,
      body!.resume,
      body!.isDefault
    );

    return result;
  },
  { bodySchema: createProfileSchema, verifyUser: true }
);
