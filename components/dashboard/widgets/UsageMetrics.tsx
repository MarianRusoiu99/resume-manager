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
    <Card className="md:col-span-2 group hover:border-primary/50 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">AI Usage & Efficiency</CardTitle>
          <Cpu className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <CardDescription>Token consumption and generation metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Generations</p>
                <p className="text-3xl font-bold">{data?.generationsCount || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Tokens Used</p>
                <p className="text-3xl font-bold">{data?.totalTokens.toLocaleString() || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Tokens / Gen</p>
                <p className="text-3xl font-bold">
                  {data?.generationsCount 
                    ? Math.round(data.totalTokens / data.generationsCount).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t flex justify-end">
              <Button variant="ghost" size="sm" asChild className="text-xs group/btn">
                <Link href="/analytics" className="flex items-center">
                  Detailed Analytics
                  <ArrowRight className="ml-2 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
