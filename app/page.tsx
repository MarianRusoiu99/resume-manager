import { getSession } from "@/lib/auth/dal";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default async function Home() {
  // Use DAL to check session (doesn't redirect if not authenticated)
  const session = await getSession();

  // If logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16 mt-8">
          <h1 className="text-5xl font-bold mb-4 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Resume Manager
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create, edit, and manage professional resumes with a powerful editor and optional AI integrations
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="text-3xl mb-2">📝</div>
              <CardTitle>Powerful Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Rich text editing with real-time preview. Organize sections for experience, education, skills, and more
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-3xl mb-2">🎨</div>
              <CardTitle>Custom Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose from professional templates or create your own. Export to PDF with pixel-perfect formatting
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-3xl mb-2">🤖</div>
              <CardTitle>AI Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Optional AI features to enhance content, tailor for jobs, and generate cover letters
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center mb-24">
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register">
                Get Started
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <CardTitle className="text-lg">Create Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Build your master profile with all your experience and skills
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <CardTitle className="text-lg">Edit & Customize</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Use the editor to craft and refine your resume content
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <CardTitle className="text-lg">Choose Template</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Select a professional template that fits your style
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  4
                </div>
                <CardTitle className="text-lg">Export & Apply</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Download your polished resume as a PDF
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            More Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>📋</span> JSON Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Import and export using the open JSON Resume standard
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>👤</span> Multiple Profiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Maintain different versions for various career paths
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>📄</span> Cover Letters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Create matching cover letters with AI assistance
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>🔒</span> Privacy First
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Your data stays yours—encrypted and never shared
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
