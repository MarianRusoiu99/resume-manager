"use client";

import { Page } from "@/components/layout/Page";
import { useEffect, useState } from "react";
import type { DashboardStats, AnalyticsData } from "@/lib/services/analytics/analytics.service";
import { ActivityChart } from "@/components/dashboard/widgets/ActivityChart";
import { TopCompanies } from "@/components/dashboard/widgets/TopCompanies";
import { UsageMetrics } from "@/components/dashboard/widgets/UsageMetrics";
import { RecentActivity } from "@/components/dashboard/widgets/RecentActivity";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/dashboard/stats").then((res) => res.json()),
      fetch("/api/v1/analytics").then((res) => res.json())
    ])
      .then(([statsData, analytics]) => {
        setStats(statsData);
        setAnalyticsData(analytics);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Page
      title="Dashboard"
      description="Here's an overview of your resume optimization activity"
      breadcrumbs={[{ label: "Dashboard" }]}
      maxWidth="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivityChart data={analyticsData?.resumesOverTime} loading={loading} />
        <TopCompanies data={analyticsData?.topCompanies} loading={loading} />
        <UsageMetrics data={analyticsData?.aiUsage} loading={loading} />
        <RecentActivity data={stats?.recentActivity} loading={loading} />
      </div>
    </Page>
  );
}
