import { Page } from "@/components/layout/Page";

/**
 * Loading state for resumes list page
 */
export default function ResumesLoading() {
  return (
    <Page
      title="My Resumes"
      description="View and manage all your generated resumes"
      breadcrumbs={[{ label: "Resumes" }]}
      isLoading={true}
      loadingType="gallery"
    >
      <div />
    </Page>
  );
}
