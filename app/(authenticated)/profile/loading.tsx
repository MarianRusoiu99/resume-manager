import { Page } from "@/components/layout/Page";

/**
 * Loading state for profile page
 */
export default function ProfileLoading() {
  return (
    <Page
      title="Profile"
      description="Manage your professional information"
      breadcrumbs={[{ label: "Profile" }]}
      isLoading={true}
      loadingType="form"
    >
      <div />
    </Page>
  );
}
