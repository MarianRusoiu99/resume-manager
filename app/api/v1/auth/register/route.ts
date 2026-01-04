import { z } from "zod";
import { prisma } from "@/lib/db/index";
import { hashPassword } from "@/lib/auth/password";
import { logger } from "@/lib/utils/logger";
import { createApiHandler, ServiceError } from "@/lib/api/handler";
import { success } from "@/lib/types/service-result";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export const POST = createApiHandler(
  async (request, context, session, body) => {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body!.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ServiceError("User with this email already exists", "CONFLICT");
    }

    const passwordHash = await hashPassword(body!.password);

    const user = await prisma.user.create({
      data: {
        email: body!.email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    logger.info("User registered", { userId: user.id });

    return success({
      message: "User created successfully",
      user,
    });
  },
  {
    isPublic: true,
    rateLimit: "auth",
    bodySchema: registerSchema,
  }
);
