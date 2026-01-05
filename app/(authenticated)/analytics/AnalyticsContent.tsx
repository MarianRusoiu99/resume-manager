"use client";

import { Page } from "@/components/layout/Page";
import { Activity, Building2, Cpu, ArrowUpRight, TrendingUp } from "lucide-react";
import type { AnalyticsData } from "@/lib/services/analytics/analytics.service";

interface AnalyticsContentProps {
  data: AnalyticsData | null;
  isLoading: boolean;
}

export function AnalyticsContent({ data, isLoading }: AnalyticsContentProps) {
  const maxResumeCount = data?.resumesOverTime?.length
    ? Math.max(...data.resumesOverTime.map(d => d.count))
    : 0;

  return (
    <Page
      title="Analytics"
      description="Insights into your resume optimization and job search activity"
      isLoading={isLoading}
      loadingType="dashboard"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border-y -mx-4 sm:-mx-8">
        <div className="bg-background p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold uppercase tracking-tight">Resumes Over Time</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily generation activity</p>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="pt-2">
            {data?.resumesOverTime?.length ? (
              <div className="flex items-end justify-between h-48 gap-2 px-2">
                {data.resumesOverTime.map((item) => (
                  <div key={item.date} className="flex-1 group relative flex flex-col items-center">
                    <div
                      className="w-full bg-primary/20 group-hover:bg-primary/40 transition-colors relative"
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
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border border-dashed">
                <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No activity recorded yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-background p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold uppercase tracking-tight">Top Companies</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Targeted organizations</p>
            </div>
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="pt-2">
            {data?.topCompanies.length ? (
              <div className="space-y-4">
                {data.topCompanies.slice(0, 5).map((company, i) => (
                  <div key={company.name} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate uppercase tracking-tight">{company.name}</span>
                        <span className="text-xs font-bold">{company.count}</span>
                      </div>
                      <div className="h-1 w-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${(company.count / (data.topCompanies[0]?.count || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border border-dashed">
                <Building2 className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Start applying to see company stats</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-muted/30 p-6 md:col-span-2 border-t">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold uppercase tracking-tight">AI Resource Usage</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Tokens and generations efficiency</p>
            </div>
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
            <div className="p-6 bg-background relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="h-12 w-12" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Generations</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{data?.aiUsage.generationsCount || 0}</p>
                <span className="text-[10px] text-green-500 flex items-center gap-0.5 font-bold uppercase">
                  <ArrowUpRight className="h-3 w-3" />
                  Live
                </span>
              </div>
            </div>

            <div className="p-6 bg-background relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cpu className="h-12 w-12" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Tokens Consumed</p>
              <p className="text-3xl font-bold">{data?.aiUsage.totalTokens.toLocaleString() || 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase">Across all models</p>
            </div>

            <div className="p-6 bg-background relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="h-12 w-12" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Efficiency</p>
              <p className="text-3xl font-bold">
                {data?.aiUsage.generationsCount
                  ? Math.round(data.aiUsage.totalTokens / data.aiUsage.generationsCount).toLocaleString()
                  : 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase">Tokens per generation</p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
