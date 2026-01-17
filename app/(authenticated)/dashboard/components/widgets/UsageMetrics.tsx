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
    <Card className="rounded-xl shadow-sm overflow-hidden border-none bg-card/50 backdrop-blur-sm md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">AI Resource Usage</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-wider">Efficiency and token consumption</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Cpu className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-background/50 rounded-xl border border-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Generations</p>
                <p className="text-2xl font-bold text-primary">{data?.generationsCount || 0}</p>
              </div>
              <div className="p-4 bg-background/50 rounded-xl border border-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Tokens Used</p>
                <p className="text-2xl font-bold text-primary">{data?.totalTokens.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 bg-background/50 rounded-xl border border-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Tokens / Gen</p>
                <p className="text-2xl font-bold text-primary">
                  {data?.generationsCount
                    ? Math.round(data.totalTokens / data.generationsCount).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" asChild className="text-[10px] h-8 px-3 font-bold uppercase tracking-widest text-primary hover:bg-primary/5">
                <Link href="/analytics" className="flex items-center">
                  Detailed Analytics
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
