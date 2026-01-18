import { prisma } from "@/lib/db/index";
import { getSession } from "@/lib/auth/dal";
import { redirect } from "next/navigation";

export async function getRecentActivity() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const userId = session.userId;

  const [recentResumes, recentCoverLetters, recentProfiles] = await Promise.all([
    prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { jobPosting: { include: { company: true } } },
    }),
    prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { jobPosting: { include: { company: true } } },
    }),
    prisma.profile.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ]);

  const activity = [
    ...recentResumes.map((r) => ({
      id: r.id,
      type: 'RESUME' as const,
      title: r.jobPosting?.title || 'Untitled Resume',
      date: r.createdAt,
    })),
    ...recentCoverLetters.map((cl) => ({
      id: cl.id,
      type: 'COVER_LETTER' as const,
      title: cl.jobPosting?.title || 'Untitled Cover Letter',
      date: cl.createdAt,
    })),
    ...recentProfiles.map((p) => ({
      id: p.id,
      type: 'PROFILE' as const,
      title: `Profile: ${p.name}`,
      date: p.updatedAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return { activity };
}
