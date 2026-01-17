import { Page } from "@/components/layout/Page";

interface DashboardHeaderProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
  return (
    <Page
      title={title}
      description={description}
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      {children}
    </Page>
  );
}
