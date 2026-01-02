"use client";

import { Page } from "@/components/layout/Page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Activity, Building2, Cpu, ArrowUpRight, TrendingUp } from "lucide-react";
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

  const maxResumeCount = data?.resumesOverTime?.length 
    ? Math.max(...data.resumesOverTime.map(d => d.count)) 
    : 0;

  return (
    <Page
      title="Analytics"
      description="Insights into your resume optimization and job search activity"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Resumes Over Time</CardTitle>
                <CardDescription>Daily generation activity</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {data?.resumesOverTime?.length ? (
              <div className="flex items-end justify-between h-48 gap-2 px-2">
                {data.resumesOverTime.map((item) => (
                  <div key={item.date} className="flex-1 group relative flex flex-col items-center">
                    <div 
                      className="w-full bg-primary/20 group-hover:bg-primary/40 transition-colors rounded-t-sm relative"
                      style={{ 
                        height: `${maxResumeCount > 0 ? (item.count / maxResumeCount) * 100 : 0}%`,
                        minHeight: item.count > 0 ? '4px' : '0'
                      }}
                    >
                      {item.count > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-sm border whitespace-nowrap z-10">
                          {item.count} resumes
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground rotate-45 origin-left truncate w-0 group-hover:w-auto transition-all">
                      {item.date}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-lg">
                <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No activity recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Top Companies</CardTitle>
                <CardDescription>Targeted organizations</CardDescription>
              </div>
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {data?.topCompanies.length ? (
              <div className="space-y-3">
                {data.topCompanies.slice(0, 5).map((company, i) => (
                  <div key={company.name} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{company.name}</span>
                        <span className="text-xs font-bold">{company.count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ 
                            width: `${(company.count / data.topCompanies[0].count) * 100}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-lg">
                <Building2 className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Start applying to see company stats</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">AI Resource Usage</CardTitle>
                <CardDescription>Tokens and generations efficiency</CardDescription>
              </div>
              <Cpu className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="p-4 rounded-xl bg-muted/50 border relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity className="h-12 w-12" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Generations</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{data?.aiUsage.generationsCount || 0}</p>
                  <span className="text-xs text-green-500 flex items-center gap-0.5 font-medium">
                    <ArrowUpRight className="h-3 w-3" />
                    Live
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Cpu className="h-12 w-12" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tokens Consumed</p>
                <p className="text-3xl font-bold">{data?.aiUsage.totalTokens.toLocaleString() || 0}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Across all models</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="h-12 w-12" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Efficiency (Tokens/Gen)</p>
                <p className="text-3xl font-bold">
                  {data?.aiUsage.generationsCount 
                    ? Math.round(data.aiUsage.totalTokens / data.aiUsage.generationsCount).toLocaleString()
                    : 0}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Lower is more efficient</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
