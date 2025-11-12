import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for profile page
 */
export default function ProfileLoading() {
  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your professional information"
        breadcrumbs={[
          { label: "Profile" },
        ]}
      />
      <PageContainer>
        <div className="space-y-8">
          {/* Personal Info Section */}
          {[1, 2, 3, 4, 5, 6, 7].map((section) => (
            <Card key={section}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((field) => (
                  <div key={field} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
