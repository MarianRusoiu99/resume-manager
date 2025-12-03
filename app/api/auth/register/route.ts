import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { checkRateLimit, RateLimitConfigs } from "@/lib/middleware/rate-limit-helpers";
import { logger } from "@/lib/utils/logger";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per 15 minutes)
    const rateLimitCheck = await checkRateLimit(request, RateLimitConfigs.auth);
    if (rateLimitCheck.limited) {
      return rateLimitCheck.response!;
    }

    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        name: validated.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json(
      { 
        message: "User created successfully",
        user 
      },
      { status: 201 }
    );

    return rateLimitCheck.addHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("Registration error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
