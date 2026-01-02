"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileCheck, FileText, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DashboardStats } from "@/lib/services/analytics/analytics.service";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";

interface RecentActivityProps {
  data: DashboardStats["recentActivity"] | undefined;
  loading: boolean;
}

export function RecentActivity({ data, loading }: RecentActivityProps) {
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'RESUME': return <FileCheck className="h-4 w-4 text-primary" />;
      case 'COVER_LETTER': return <FileText className="h-4 w-4 text-primary" />;
      case 'PROFILE': return <User className="h-4 w-4 text-primary" />;
      default: return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  const getItemHref = (item: any) => {
    switch (item.type) {
      case 'RESUME': return ROUTES.RESUME(item.id);
      case 'COVER_LETTER': return ROUTES.COVER_LETTER(item.id);
      case 'PROFILE': return ROUTES.PROFILE(item.id);
      default: return '#';
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'RESUME': return 'Resume';
      case 'COVER_LETTER': return 'Cover Letter';
      case 'PROFILE': return 'Profile';
      default: return 'Document';
    }
  };

  return (
    <div className="bg-background p-6 md:col-span-2 border-t">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold uppercase tracking-tight">Recent Activity</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Your latest generated documents and updates</p>
        </div>
        <Clock className="h-5 w-5 text-primary" />
      </div>
      <div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse" />
            ))}
          </div>
        ) : data?.length ? (
          <div className="space-y-1">
            {data.map((item) => (
              <Link 
                key={item.id} 
                href={getItemHref(item)}
                className="flex items-center justify-between p-3 hover:bg-primary/5 transition-colors group/item border-b last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 group-hover/item:bg-primary/20 transition-colors">
                    {getItemIcon(item.type)}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight">{item.title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                      {getItemTypeLabel(item.type)}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                </div>
              </Link>
            ))}
            <div className="pt-6 flex justify-center">
              <Button variant="link" size="sm" className="text-xs p-0 h-auto font-bold uppercase tracking-widest text-primary" asChild>
                <Link href={ROUTES.RESUMES}>View All Activity</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed">
            No recent activity to show
          </div>
        )}
      </div>
    </div>
  );
}
