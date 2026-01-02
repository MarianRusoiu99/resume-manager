"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileCheck, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DashboardStats } from "@/lib/services/analytics/analytics.service";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";

interface RecentActivityProps {
  data: DashboardStats["recentActivity"] | undefined;
  loading: boolean;
}

export function RecentActivity({ data, loading }: RecentActivityProps) {
  return (
    <Card className="md:col-span-2 group hover:border-primary/50 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <CardDescription>Your latest generated documents</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : data?.length ? (
          <div className="space-y-2">
            {data.map((item) => (
              <Link 
                key={item.id} 
                href={item.type === 'RESUME' ? ROUTES.RESUME(item.id) : ROUTES.COVER_LETTER(item.id)}
                className="flex items-center justify-between p-2 hover:bg-primary/5 rounded-lg transition-colors group/item"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full group-hover/item:bg-primary/20 transition-colors">
                    {item.type === 'RESUME' ? (
                      <FileCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.type === 'RESUME' ? 'Resume' : 'Cover Letter'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                </div>
              </Link>
            ))}
            <div className="pt-4 mt-2 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href={ROUTES.RESUMES}>View All Resumes</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            No recent activity to show
          </div>
        )}
      </CardContent>
    </Card>
  );
}
