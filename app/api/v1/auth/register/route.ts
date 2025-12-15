import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { logger } from "@/lib/utils/logger";
import { createApiHandler, ServiceError } from "@/lib/api-handler";
import { success } from "@/lib/types/service-result";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
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
        name: body!.name,
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
