import { createApiHandler } from "@/lib/api-handler";
import { profileRepository } from "@/lib/repositories/profile.repository";
import { nanoid } from "nanoid";
import { z } from "zod";
import { failure, success } from "@/lib/types/service-result";

const togglePublicSchema = z.object({
  isPublic: z.boolean(),
});

/**
 * Toggle profile public status
 * POST /api/profile/[id]/public
 */
export const POST = createApiHandler(
  async (request, { params }, session, body) => {
    const { id } = await params;

    // Verify ownership
    const profile = await profileRepository.findById(id, session.user.id);
    if (!profile) {
      return failure("Profile not found", "NOT_FOUND");
    }

    // Generate slug if making public and doesn't have one
    let publicSlug = profile.publicSlug;
    if (body!.isPublic && !publicSlug) {
      publicSlug = nanoid(10); // Generate short unique slug
    }

    // Update profile
    const updated = await profileRepository.update(id, session.user.id, {
      isPublic: body!.isPublic,
      publicSlug: body!.isPublic ? publicSlug : null,
    });

    return success({
      isPublic: updated.isPublic,
      publicSlug: updated.publicSlug,
    });
  },
  { bodySchema: togglePublicSchema }
);
