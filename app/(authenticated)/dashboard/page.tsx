import { DashboardHeader } from "@/components/dashboard/server/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/client/DashboardContent";

export default function DashboardPage() {
  return (
    <DashboardHeader
      title="Dashboard"
      description="Here's an overview of your resume optimization activity"
    >
      <DashboardContent />
    </DashboardHeader>
  );
}
