import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { profileService } from "@/lib/services/profile.service";

// GET /api/profile - Get user profile
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await profileService.getProfile(session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/profile - Create user profile
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await profileService.createProfile(session.user.id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Profile POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await profileService.updateProfile(session.user.id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Upsert user profile (create or update)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await profileService.upsertProfile(session.user.id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile - Delete user profile
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await profileService.deleteProfile(session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Profile DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
