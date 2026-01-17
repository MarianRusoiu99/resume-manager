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
    <Card className="rounded-xl shadow-sm overflow-hidden border-none bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Top Companies</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-wider">Targeted most often</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
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
            {data.slice(0, 5).map((company, i) => (
              <div key={company.name} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-[10px] font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold truncate uppercase tracking-tight">{company.name}</span>
                    <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{company.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
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
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg text-xs">No data available</div>
        )}
      </CardContent>
    </Card>
  );
}
