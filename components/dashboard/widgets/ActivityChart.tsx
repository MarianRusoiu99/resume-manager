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
    <div className="bg-background p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold uppercase tracking-tight">Resumes Over Time</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Last 30 days of generation activity</p>
        </div>
        <Activity className="h-5 w-5 text-primary" />
      </div>
      <div>
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-muted" />
            ))}
          </div>
        ) : data?.length ? (
          <div className="space-y-4">
            {(() => {
              const maxCount = Math.max(...data.map(d => d.count), 1);
              return data.slice(-5).map((item) => (
                <div key={item.date} className="flex items-center gap-4">
                  <div className="text-xs font-bold uppercase tracking-wider w-20 text-muted-foreground">{item.date}</div>
                  <div className="flex-1 h-1 bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out" 
                      style={{ width: `${(item.count / maxCount) * 100}%` }} 
                    />
                  </div>
                  <div className="text-sm font-bold min-w-[20px] text-right">{item.count}</div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed text-sm">No data available</div>
        )}
      </div>
    </div>
  );
}
