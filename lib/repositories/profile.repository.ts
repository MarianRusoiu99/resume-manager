import { prisma } from "@/lib/db";
import type { Resume } from "@/lib/validations/jsonresume";

export class ProfileRepository {
  async findByUserId(userId: string) {
    return prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  async create(userId: string, resume: Resume) {
    return prisma.userProfile.create({
      data: {
        userId,
        resume: resume as never,
      },
    });
  }

  async update(userId: string, resume: Resume) {
    return prisma.userProfile.update({
      where: { userId },
      data: {
        resume: resume as never,
      },
    });
  }

  async upsert(userId: string, resume: Resume) {
    const existing = await this.findByUserId(userId);

    if (existing) {
      return this.update(userId, resume);
    } else {
      return this.create(userId, resume);
    }
  }

  async delete(userId: string) {
    return prisma.userProfile.delete({
      where: { userId },
    });
  }

  async exists(userId: string): Promise<boolean> {
    const count = await prisma.userProfile.count({
      where: { userId },
    });
    return count > 0;
  }
}

export const profileRepository = new ProfileRepository();
