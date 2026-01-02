"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { AnalyticsData } from "@/lib/services/analytics/analytics.service";

interface TopCompaniesProps {
  data: AnalyticsData["topCompanies"] | undefined;
  loading: boolean;
}

export function TopCompanies({ data, loading }: TopCompaniesProps) {
  return (
    <div className="bg-background p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold uppercase tracking-tight">Top Companies</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Companies you've targeted most</p>
        </div>
        <Building2 className="h-5 w-5 text-primary" />
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
            {data.slice(0, 5).map((company, i) => (
              <div key={company.name} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
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
                        width: `${(company.count / data[0].count) * 100}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed text-sm">No data available</div>
        )}
      </div>
    </div>
  );
}
