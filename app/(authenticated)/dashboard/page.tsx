import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Key, Sparkles, User, Palette, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  const quickActions = [
    {
      title: "Setup Profile",
      description: "Add your experience, education, and skills",
      href: "/profile",
      icon: User,
    },
    {
      title: "Generate Resume",
      description: "Create an ATS-optimized resume from a job description",
      href: "/generate",
      icon: Sparkles,
    },
    {
      title: "Generate Cover Letter",
      description: "Create an cover letter from a job description based on your profile",
      href: "/cover-letter",
      icon: Sparkles,
    },
    {
      title: "My Resumes",
      description: "View and manage your generated resumes",
      href: "/resumes",
      icon: FileText,
    },
    {
      title: "Templates",
      description: "Browse and customize resume templates",
      href: "/templates",
      icon: Palette,
    },
    {
      title: "Cover Letters",
      description: "Cover Letters",
      href: "/cover-letters",
      icon: TrendingUp,
    },
    {
      title: "Coming Soon",
      description: "Job automation and application tracking",
      href: "#",
      icon: TrendingUp,
      disabled: true,
    },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome, ${session.user?.name || session.user?.email}!`}
        description="Get started by setting up your profile and generating your first resume"
        breadcrumbs={[{ label: "Dashboard" }]}
      />
      <PageContainer>
        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const Component = action.disabled ? "div" : Link;
            
            return (
              <Component
                key={action.title}
                href={action.href}
                className={action.disabled ? "cursor-not-allowed" : ""}
              >
                <Card className={`h-full transition-all ${
                  action.disabled 
                    ? "bg-muted/50" 
                    : "hover:shadow-md hover:border-primary/50"
                }`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${action.disabled ? "text-muted-foreground" : "text-primary"}`} />
                      <CardTitle className={action.disabled ? "text-muted-foreground" : ""}>
                        {action.title}
                      </CardTitle>
                    </div>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Component>
            );
          })}
        </div>

        {/* Getting Started Guide */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-semibold">1.</span>
                <span>Complete your professional profile with your experience, education, and skills</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">2.</span>
                <span>Add your OpenAI API key in settings (we use your key to keep costs in your control)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">3.</span>
                <span>Paste a job description and let AI generate an optimized resume tailored to that role</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">4.</span>
                <span>Customize the template, edit content if needed, and download as PDF</span>
              </li>
            </ol>
          </CardHeader>
        </Card>
      </PageContainer>
    </>
  );
}
