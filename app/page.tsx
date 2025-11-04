import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  // If logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Resume Optimizer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate ATS-optimized resumes tailored to specific job descriptions using advanced AI agents
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered Optimization
            </h3>
            <p className="text-gray-600">
              Multi-agent AI workflow analyzes job descriptions and tailors your resume perfectly
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ATS-Compliant
            </h3>
            <p className="text-gray-600">
              Optimized for Applicant Tracking Systems to increase your chances of getting noticed
            </p>
          </div>

          
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="space-x-4">
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Create Profile</h4>
              <p className="text-sm text-gray-600">
                Add your experience, skills, and education
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Add API Key</h4>
              <p className="text-sm text-gray-600">
                Configure your OpenAI API key securely
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Paste Job Description</h4>
              <p className="text-sm text-gray-600">
                AI analyzes and optimizes your resume
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Download PDF</h4>
              <p className="text-sm text-gray-600">
                Get your tailored, professional resume
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
