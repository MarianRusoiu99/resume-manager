import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/server/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/client/DashboardContent";
import { getDashboardData } from "@/app/actions/analytics";
import { FeatureErrorBoundary } from "@/components/error-boundaries";

async function DashboardDataWrapper() {
  const { stats, analytics } = await getDashboardData();
  return <DashboardContent stats={stats} analyticsData={analytics} />;
}

export default function DashboardPage() {
  return (
    <DashboardHeader
      title="Dashboard"
      description="Here's an overview of your resume optimization activity"
    >
      <FeatureErrorBoundary featureName="Dashboard Stats">
        <Suspense fallback={<DashboardContent stats={null} analyticsData={null} loading={true} />}>
          <DashboardDataWrapper />
        </Suspense>
      </FeatureErrorBoundary>
    </DashboardHeader>
  );
}
