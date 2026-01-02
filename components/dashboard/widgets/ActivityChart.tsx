"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import type { AnalyticsData } from "@/lib/services/analytics/analytics.service";

interface ActivityChartProps {
  data: AnalyticsData["resumesOverTime"] | undefined;
  loading: boolean;
}

export function ActivityChart({ data, loading }: ActivityChartProps) {
  return (
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
        ) : data?.length ? (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.date} className="flex items-center gap-4">
                <div className="text-sm font-medium w-24">{item.date}</div>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(item.count / Math.max(...data.map(d => d.count))) * 100}%` }} 
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
  );
}
