import { prisma } from "@/lib/db";
import { Profile } from "@/lib/validations/profile";

export class ProfileRepository {
  async findByUserId(userId: string) {
    return prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  async create(userId: string, data: Profile) {
    return prisma.userProfile.create({
      data: {
        userId,
        personalInfo: data.personalInfo,
        summary: data.summary,
        experience: data.experience,
        education: data.education,
        skills: data.skills,
        certifications: data.certifications || [],
      },
    });
  }

  async update(userId: string, data: Partial<Profile>) {
    return prisma.userProfile.update({
      where: { userId },
      data: {
        ...(data.personalInfo && { personalInfo: data.personalInfo }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.experience && { experience: data.experience }),
        ...(data.education && { education: data.education }),
        ...(data.skills && { skills: data.skills }),
        ...(data.certifications !== undefined && {
          certifications: data.certifications,
        }),
      },
    });
  }

  async upsert(userId: string, data: Profile) {
    const existing = await this.findByUserId(userId);

    if (existing) {
      return this.update(userId, data);
    } else {
      return this.create(userId, data);
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
