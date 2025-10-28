import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { profileService } from "@/lib/services/profile.service";
import { logger } from "@/lib/utils/logger";

// GET /api/profile - Get user profile
export async function GET() {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn("Unauthorized profile access attempt", { endpoint: "GET /api/profile" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = session.user.id;
    logger.debug("Fetching profile", { userId, endpoint: "GET /api/profile" });

    const result = await profileService.getProfile(userId);

    if (!result.success) {
      logger.warn("Profile fetch failed", { userId, error: result.error });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const duration = Date.now() - startTime;
    logger.info("Profile fetched successfully", { userId, duration, endpoint: "GET /api/profile" });

    return NextResponse.json(result.data);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Profile GET error", error, { userId, duration, endpoint: "GET /api/profile" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/profile - Create user profile
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn("Unauthorized profile creation attempt", { endpoint: "POST /api/profile" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = session.user.id;
    const body = await request.json();

    logger.debug("Creating profile", { userId, endpoint: "POST /api/profile" });

    const result = await profileService.createProfile(userId, body);

    if (!result.success) {
      logger.warn("Profile creation failed", { userId, error: result.error });
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info("Profile created successfully", { userId, duration, endpoint: "POST /api/profile" });

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Profile POST error", error, { userId, duration, endpoint: "POST /api/profile" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn("Unauthorized profile update attempt", { endpoint: "PATCH /api/profile" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = session.user.id;
    const body = await request.json();

    logger.debug("Updating profile", { userId, endpoint: "PATCH /api/profile" });

    const result = await profileService.updateProfile(userId, body);

    if (!result.success) {
      logger.warn("Profile update failed", { userId, error: result.error });
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info("Profile updated successfully", { userId, duration, endpoint: "PATCH /api/profile" });

    return NextResponse.json(result.data);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Profile PATCH error", error, { userId, duration, endpoint: "PATCH /api/profile" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Upsert user profile (create or update)
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn("Unauthorized profile upsert attempt", { endpoint: "PUT /api/profile" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = session.user.id;
    const body = await request.json();

    logger.debug("Upserting profile", { userId, endpoint: "PUT /api/profile" });

    const result = await profileService.upsertProfile(userId, body);

    if (!result.success) {
      logger.warn("Profile upsert failed", { userId, error: result.error });
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info("Profile upserted successfully", { userId, duration, endpoint: "PUT /api/profile" });

    return NextResponse.json(result.data);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Profile PUT error", error, { userId, duration, endpoint: "PUT /api/profile" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile - Delete user profile
export async function DELETE() {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn("Unauthorized profile deletion attempt", { endpoint: "DELETE /api/profile" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = session.user.id;

    logger.debug("Deleting profile", { userId, endpoint: "DELETE /api/profile" });

    const result = await profileService.deleteProfile(userId);

    if (!result.success) {
      logger.warn("Profile deletion failed", { userId, error: result.error });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const duration = Date.now() - startTime;
    logger.info("Profile deleted successfully", { userId, duration, endpoint: "DELETE /api/profile" });

    return NextResponse.json({ message: "Profile deleted successfully" });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Profile DELETE error", error, { userId, duration, endpoint: "DELETE /api/profile" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
