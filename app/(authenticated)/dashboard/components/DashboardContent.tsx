'use client';

import type { DashboardStats, AnalyticsData } from "@/lib/services/analytics/analytics.service";
import { ActivityChart } from "./widgets/ActivityChart";
import { TopCompanies } from "./widgets/TopCompanies";
import { UsageMetrics } from "./widgets/UsageMetrics";
import { RecentActivity } from "./widgets/RecentActivity";

interface DashboardContentProps {
  stats: DashboardStats | null;
  analyticsData: AnalyticsData | null;
  loading?: boolean;
}

export function DashboardContent({ stats, analyticsData, loading = false }: DashboardContentProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ActivityChart data={analyticsData?.resumesOverTime} loading={loading} />
      <TopCompanies data={analyticsData?.topCompanies} loading={loading} />
      <UsageMetrics data={analyticsData?.aiUsage} loading={loading} />
      <RecentActivity data={stats?.recentActivity} loading={loading} />
    </div>
  );
}
