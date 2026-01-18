import { Suspense } from "react";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardContent } from "./components/DashboardContent";
import { getRecentActivity } from "@/app/actions/dashboard";
import { FeatureErrorBoundary } from "@/components/error-boundaries";

async function DashboardDataWrapper() {
  const { activity } = await getRecentActivity();
  return <DashboardContent activity={activity} />;
}

export default function DashboardPage() {
  return (
    <DashboardHeader
      title="Dashboard"
      description="Here's an overview of your resume optimization activity"
    >
      <FeatureErrorBoundary featureName="Recent Activity">
        <Suspense fallback={<DashboardContent activity={[]} loading={true} />}>
          <DashboardDataWrapper />
        </Suspense>
      </FeatureErrorBoundary>
    </DashboardHeader>
  );
}
