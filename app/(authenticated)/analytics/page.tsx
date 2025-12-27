"use client";

import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Activity, Building2, Cpu } from "lucide-react";
import type { AnalyticsData } from "@/lib/services/analytics/analytics.service";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/analytics")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Page title="Analytics" description="Loading your activity data...">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted" />
              <CardContent className="h-48 bg-muted/50" />
            </Card>
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Analytics"
      description="Insights into your resume optimization and job search activity"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
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
            {data?.resumesOverTime.length ? (
              <div className="space-y-4">
                {data.resumesOverTime.map((item) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <div className="text-sm font-medium w-24">{item.date}</div>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(item.count / Math.max(...data.resumesOverTime.map(d => d.count))) * 100}%` }} 
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
            {data?.topCompanies.length ? (
              <div className="space-y-4">
                {data.topCompanies.map((company) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Generations</p>
                <p className="text-3xl font-bold">{data?.aiUsage.generationsCount || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Tokens Used</p>
                <p className="text-3xl font-bold">{data?.aiUsage.totalTokens.toLocaleString() || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Tokens / Gen</p>
                <p className="text-3xl font-bold">
                  {data?.aiUsage.generationsCount 
                    ? Math.round(data.aiUsage.totalTokens / data.aiUsage.generationsCount).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
