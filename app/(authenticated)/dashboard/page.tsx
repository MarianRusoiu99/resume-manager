import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Sparkles, User, Plus } from "lucide-react";
import { auth } from "@/lib/auth/config";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name || 'User'}`}
        description="Here's an overview of your resume optimization activity"
      />
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Resumes
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Generated resumes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Profiles
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Active profiles
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Optimizations
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button asChild className="w-full justify-start" size="lg">
                <Link href="/generate">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate New Resume
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="lg">
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Manage Profiles
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="lg">
                <Link href="/resumes">
                  <FileText className="mr-2 h-4 w-4" />
                  View All Resumes
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest generated documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-8">
                No recent activity to show
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
