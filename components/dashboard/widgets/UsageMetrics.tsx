"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Cpu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalyticsData } from "@/lib/services/analytics/analytics.service";

interface UsageMetricsProps {
  data: AnalyticsData["aiUsage"] | undefined;
  loading: boolean;
}

export function UsageMetrics({ data, loading }: UsageMetricsProps) {
  return (
    <div className="bg-muted/30 p-6 md:col-span-2 border-t">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold uppercase tracking-tight">AI Resource Usage</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Tokens and generations efficiency</p>
        </div>
        <Cpu className="h-5 w-5 text-primary" />
      </div>
      <div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-background" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
              <div className="p-6 bg-background">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Generations</p>
                <p className="text-3xl font-bold">{data?.generationsCount || 0}</p>
              </div>
              <div className="p-6 bg-background">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Tokens Used</p>
                <p className="text-3xl font-bold">{data?.totalTokens.toLocaleString() || 0}</p>
              </div>
              <div className="p-6 bg-background">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Efficiency</p>
                <p className="text-3xl font-bold">
                  {data?.generationsCount 
                    ? Math.round(data.totalTokens / data.generationsCount).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="link" size="sm" asChild className="text-xs p-0 h-auto font-bold uppercase tracking-widest text-primary">
                <Link href="/analytics" className="flex items-center">
                  Detailed Analytics
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
