"use client";

import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileCheck, FileText, Activity, Building2, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import type { DashboardStats, AnalyticsData } from "@/lib/services/analytics/analytics.service";
import { formatDistanceToNow } from "date-fns";

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
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Resumes Over Time</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Last 30 days of generation activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-muted rounded" />
                ))}
              </div>
            ) : analyticsData?.resumesOverTime.length ? (
              <div className="space-y-4">
                {analyticsData.resumesOverTime.map((item) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <div className="text-sm font-medium w-24">{item.date}</div>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(item.count / Math.max(...analyticsData.resumesOverTime.map(d => d.count))) * 100}%` }} 
                      />
                    </div>
                    <div className="text-sm font-bold">{item.count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Top Companies</CardTitle>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Companies you've targeted most</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-muted rounded" />
                ))}
              </div>
            ) : analyticsData?.topCompanies.length ? (
              <div className="space-y-4">
                {analyticsData.topCompanies.map((company) => (
                  <div key={company.name} className="flex items-center justify-between">
                    <div className="text-sm font-medium">{company.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold">{company.count}</div>
                      <div className="text-xs text-muted-foreground">resumes</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">AI Usage & Efficiency</CardTitle>
              <Cpu className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Token consumption and generation metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Generations</p>
                  <p className="text-3xl font-bold">{analyticsData?.aiUsage.generationsCount || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Tokens Used</p>
                  <p className="text-3xl font-bold">{analyticsData?.aiUsage.totalTokens.toLocaleString() || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg. Tokens / Gen</p>
                  <p className="text-3xl font-bold">
                    {analyticsData?.aiUsage.generationsCount 
                      ? Math.round(analyticsData.aiUsage.totalTokens / analyticsData.aiUsage.generationsCount).toLocaleString()
                      : 0}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Your latest generated documents</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : stats?.recentActivity.length ? (
              <div className="space-y-4">
                {stats.recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        {item.type === 'RESUME' ? (
                          <FileCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.type === 'RESUME' ? 'Resume' : 'Cover Letter'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                No recent activity to show
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
