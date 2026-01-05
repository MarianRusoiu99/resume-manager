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
  const getItemIcon = (type: NonNullable<DashboardStats["recentActivity"]>[number]["type"]) => {
    switch (type) {
      case "RESUME":
        return <FileText className="h-4 w-4 text-primary" />;
      case "COVER_LETTER":
        return <FileCheck className="h-4 w-4 text-primary" />;
      case "PROFILE":
        return <User className="h-4 w-4 text-primary" />;
      default:
        return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  const getItemTypeLabel = (type: NonNullable<DashboardStats["recentActivity"]>[number]["type"]) => {
    switch (type) {
      case "RESUME":
        return "Resume";
      case "COVER_LETTER":
        return "Cover Letter";
      case "PROFILE":
        return "Profile";
      default:
        return type;
    }
  };

  const getItemHref = (item: NonNullable<RecentActivityProps["data"]>[number]) => {
    switch (item.type) {
      case "RESUME":
        return ROUTES.RESUME(item.id);
      case "COVER_LETTER":
        return ROUTES.COVER_LETTER(item.id);
      case "PROFILE":
        return ROUTES.PROFILE(item.id);
      default:
        return ROUTES.DASHBOARD;
    }
  };

  return (
    <Card className="rounded-xl shadow-sm overflow-hidden border-none bg-card/50 backdrop-blur-sm md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Recent Activity</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-wider">Latest documents and updates</CardDescription>
        </div>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Clock className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : data?.length ? (
          <div className="space-y-2">
            {data.map((item) => (
              <Link
                key={item.id}
                href={getItemHref(item)}
                className="flex items-center justify-between p-3 hover:bg-primary/5 transition-all group/item rounded-xl border border-transparent hover:border-primary/5 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-primary/10 rounded-lg group-hover/item:bg-primary/20 transition-colors">
                    {getItemIcon(item.type)}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tight">{item.title}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                      {getItemTypeLabel(item.type)}
                    </p>
                  </div>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center py-10 border border-dashed rounded-xl">
            No recent activity to show
          </div>
        )}
      </CardContent>
    </Card>
  );
}
