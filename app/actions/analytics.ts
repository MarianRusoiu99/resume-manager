import { analyticsService } from "@/lib/services/analytics/analytics.service";
import { getSession } from "@/lib/auth/dal";
import { redirect } from "next/navigation";

export async function getDashboardData() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const [statsResult, analyticsResult] = await Promise.all([
    analyticsService.getDashboardStats(session.userId),
    analyticsService.getAnalyticsData(session.userId),
  ]);

  return {
    stats: statsResult.success ? statsResult.data : null,
    analytics: analyticsResult.success ? analyticsResult.data : null,
  };
}
