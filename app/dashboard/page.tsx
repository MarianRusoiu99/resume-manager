import { auth, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Resume Optimizer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user?.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {session.user?.name || session.user?.email}!
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Get started by setting up your profile and API key
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/profile"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              📝 Setup Profile
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Add your experience, education, and skills
            </p>
          </Link>

          <Link
            href="/settings/api-keys"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              🔑 Configure API Key
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Add your OpenAI API key to generate resumes
            </p>
          </Link>

          <Link
            href="/generate"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              ✨ Generate Resume
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Create an ATS-optimized resume from a job description
            </p>
          </Link>

          <Link
            href="/resumes"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              📄 My Resumes
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              View and manage your generated resumes
            </p>
          </Link>

          <Link
            href="/templates"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              🎨 Templates
            </h3>
            <p className="mt-2 text-gray-600">
              Browse and customize resume templates
            </p>
          </Link>

          <div className="block p-6 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700">
              📊 Coming Soon
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Analytics and optimization insights
            </p>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900">
            🚀 Getting Started
          </h3>
          <ol className="mt-4 space-y-3 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <span>Complete your professional profile with your experience, education, and skills</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <span>Add your OpenAI API key in settings (we use your key to keep costs in your control)</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <span>Paste a job description and let AI generate an optimized resume tailored to that role</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <span>Customize the template, edit content if needed, and download as PDF</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
