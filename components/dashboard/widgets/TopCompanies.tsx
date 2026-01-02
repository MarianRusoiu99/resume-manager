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
        ) : data?.length ? (
          <div className="space-y-4">
            {data.map((company) => (
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
  );
}
