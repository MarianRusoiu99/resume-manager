"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/shared";
import type { AnalyticsData } from "@/lib/services/analytics/analytics.service";

interface ActivityChartProps {
  data: AnalyticsData["resumesOverTime"] | undefined;
  loading: boolean;
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
  return (
    <Card className="rounded-xl shadow-sm overflow-hidden border-none bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Resumes Over Time</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-wider">Last 30 days of activity</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-muted rounded" />
            ))}
          </div>
        ) : data?.length ? (
          <div className="space-y-4">
            {(() => {
              const maxCount = Math.max(...data.map(d => d.count), 1);
              return data.slice(-5).map((item) => (
                <div key={item.date} className="flex items-center gap-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest w-16 text-muted-foreground">{item.date}</div>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold min-w-[20px] text-right">{item.count}</div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <EmptyState
            icon={<BarChart3 className="w-8 h-8 text-primary/20" />}
            title="No Activity"
            description="Your resume optimization activity will appear here."
            withCard={false}
            className="py-6"
          />
        )}
      </CardContent>
    </Card>
  );
}
