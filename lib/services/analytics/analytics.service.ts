import { prisma } from '@/lib/db/index';
import { withServiceError } from '@/lib/services/utils';
import { type ServiceResult } from '@/lib/types/service-result';

export interface DashboardStats {
  totalResumes: number;
  totalProfiles: number;
  optimizationsThisMonth: number;
  recentActivity: Array<{
    id: string;
    type: 'RESUME' | 'COVER_LETTER' | 'PROFILE';
    title: string;
    date: Date;
    status?: string;
  }>;
}

export interface AnalyticsData {
  resumesOverTime: Array<{ date: string; count: number }>;
  topCompanies: Array<{ name: string; count: number }>;
  aiUsage: {
    totalTokens: number;
    generationsCount: number;
  };
}

export class AnalyticsService {
  /**
   * Get summary stats for the dashboard
   */
  async getDashboardStats(userId: string): Promise<ServiceResult<DashboardStats>> {
    return withServiceError('get dashboard stats', async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [resumeCount, profileCount, optimizationsCount, recentResumes, recentCoverLetters, recentProfiles] = await Promise.all([
        prisma.resume.count({ where: { userId } }),
        prisma.profile.count({ where: { userId } }),
        prisma.auditLog.count({
          where: {
            userId,
            action: 'RESUME_GENERATE',
            timestamp: { gte: firstDayOfMonth },
          },
        }),
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
        .slice(0, 5);

      return {
        totalResumes: resumeCount,
        totalProfiles: profileCount,
        optimizationsThisMonth: optimizationsCount,
        recentActivity: activity,
      };
    });
  }

  /**
   * Get detailed analytics data
   */
  async getAnalyticsData(userId: string): Promise<ServiceResult<AnalyticsData>> {
    return withServiceError('get analytics data', async () => {
      // Resumes over time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const resumes = await prisma.resume.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
      });

      const resumesByDate = resumes.reduce((acc, r) => {
        const date = r.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const resumesOverTime = Object.entries(resumesByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top companies
      const topCompaniesRaw = await prisma.jobPosting.groupBy({
        by: ['companyId'],
        where: { userId, NOT: { companyId: null } },
        _count: { _all: true },
        orderBy: { _count: { companyId: 'desc' } },
        take: 5,
      });

      const companyIds = topCompaniesRaw.map((c) => c.companyId as string);
      const companies = await prisma.company.findMany({
        where: { id: { in: companyIds } },
      });

      const topCompanies = topCompaniesRaw.map((c) => ({
        name: companies.find((comp) => comp.id === c.companyId)?.name || 'Unknown',
        count: c._count._all,
      }));

      // AI Usage
      const aiLogs = await prisma.auditLog.findMany({
        where: {
          userId,
          action: 'AI_GENERATE',
        },
        select: { metadata: true },
      });

      const totalTokens = aiLogs.reduce((sum, log) => {
        const meta = log.metadata as any;
        return sum + (meta?.usage?.totalTokens || 0);
      }, 0);

      return {
        resumesOverTime,
        topCompanies,
        aiUsage: {
          totalTokens,
          generationsCount: aiLogs.length,
        },
      };
    });
  }
}

export const analyticsService = new AnalyticsService();
