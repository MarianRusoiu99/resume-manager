import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { profileRepository } from "@/lib/repositories/profile.repository";
import { nanoid } from "nanoid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Toggle profile public status
 * POST /api/profiles/[id]/public
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isPublic } = body;

    // Verify ownership
    const profile = await profileRepository.findById(id, session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Generate slug if making public and doesn't have one
    let publicSlug = profile.publicSlug;
    if (isPublic && !publicSlug) {
      publicSlug = nanoid(10); // Generate short unique slug
    }

    // Update profile
    const updated = await profileRepository.update(id, session.user.id, {
      isPublic,
      publicSlug: isPublic ? publicSlug : null,
    });

    return NextResponse.json({
      success: true,
      isPublic: updated.isPublic,
      publicSlug: updated.publicSlug,
    });
  } catch (error) {
    console.error("Error updating public status:", error);
    return NextResponse.json(
      { error: "Failed to update public status" },
      { status: 500 }
    );
  }
}
