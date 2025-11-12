import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function Home() {
  const session = await auth();

  // If logged in, redirect to dashboard
  if (session) {
    redirect("/profile");
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
            AI Resume Optimizer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate ATS-optimized resumes tailored to specific job descriptions using advanced AI agents
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="text-3xl mb-2">🤖</div>
              <CardTitle>AI-Powered Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Multi-agent AI workflow analyzes job descriptions and tailors your resume perfectly
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-3xl mb-2">🎯</div>
              <CardTitle>ATS-Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Optimized for Applicant Tracking Systems to increase your chances of getting noticed
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-3xl mb-2">⚡</div>
              <CardTitle>Fast & Easy</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate professional resumes in minutes with our streamlined workflow
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
                  Add your experience, skills, and education
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <CardTitle className="text-lg">Paste Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Copy and paste the job description you&apos;re applying for
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <CardTitle className="text-lg">AI Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI analyzes and optimizes your resume for the job
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  4
                </div>
                <CardTitle className="text-lg">Download PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get your tailored, professional resume
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
