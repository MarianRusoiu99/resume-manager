'use client';

import { RecentActivity } from "./widgets/RecentActivity";
import { QuickActions } from "./widgets/QuickActions";

export interface DashboardActivityItem {
  id: string;
  type: 'RESUME' | 'COVER_LETTER' | 'PROFILE';
  title: string;
  date: Date;
  status?: string;
}

interface DashboardContentProps {
  activity: DashboardActivityItem[];
  loading?: boolean;
}

export function DashboardContent({ activity, loading = false }: DashboardContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <RecentActivity data={activity} loading={loading} />
      </div>
      <div>
        <QuickActions />
      </div>
    </div>
  );
}
