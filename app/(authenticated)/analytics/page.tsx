import { Suspense } from "react";
import { getDashboardData } from "@/app/actions/analytics";
import { AnalyticsContent } from "./AnalyticsContent";

export default async function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsContent data={null} isLoading={true} />}>
      <AnalyticsDataWrapper />
    </Suspense>
  );
}

async function AnalyticsDataWrapper() {
  const { analytics } = await getDashboardData();
  return <AnalyticsContent data={analytics} isLoading={false} />;
}
