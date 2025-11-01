import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading state for resume detail page
 */
export default function ResumeDetailLoading() {
  return (
    <>
      <PageHeader
        title="Loading Resume..."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Resumes", href: "/resumes" },
          { label: "Loading..." },
        ]}
      />
      <PageContainer>
        {/* Action buttons skeleton */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>

        {/* Resume content skeleton */}
        <Card>
          <CardContent className="p-8">
            {/* Header section */}
            <div className="mb-8 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-56" />
            </div>

            {/* Sections skeleton */}
            {[1, 2, 3, 4].map((section) => (
              <div key={section} className="mb-8">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  {[1, 2].map((item) => (
                    <div key={item} className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
