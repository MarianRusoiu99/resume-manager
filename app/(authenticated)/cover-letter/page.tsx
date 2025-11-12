'use client';

/**
 * Cover Letter Only Generation Page
 * Allows users to generate standalone cover letters without creating a full resume
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card, Textarea } from '@/components/ui';
import { CoverLetterEditor } from '@/components/cover-letter';

export default function GenerateCoverLetterPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [personalInstructions, setPersonalInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);

  const handleGenerate = async () => {
    // Validation
    if (jobDescription.length < 50) {
      setError('Job description must be at least 50 characters long');
      toast.error('Job description must be at least 50 characters long');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedCoverLetter(null);

    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          personalInstructions: personalInstructions.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate cover letter');
      }

      const data = await response.json();
      setGeneratedCoverLetter(data.coverLetter);
      toast.success('Cover letter generated successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate cover letter';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setJobDescription('');
    setPersonalInstructions('');
    setGeneratedCoverLetter(null);
    setError(null);
  };

  const handleSaveCoverLetter = async (content: string) => {
    // Update the local state with the edited content
    setGeneratedCoverLetter(content);
  };

  return (
    <>
      <PageHeader
        title="Generate Cover Letter"
        description="Create a professional, tailored cover letter for your job application"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Cover Letter" },
        ]}
      />
      <PageContainer maxWidth="xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Job Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium  mb-2">
                  Job Description *
                </label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here (including job title and company name)..."
                  rows={16}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 50 characters ({jobDescription.length}/50)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium  mb-2">
                  Personal Instructions (Optional)
                </label>
                <Textarea
                  value={personalInstructions}
                  onChange={(e) => setPersonalInstructions(e.target.value)}
                  placeholder="Add any specific instructions for your cover letter (e.g., 'Emphasize my leadership experience', 'Use an enthusiastic tone', 'Mention my passion for AI')..."
                  rows={4}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide custom guidance to personalize your cover letter
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Generating...
                    </>
                  ) : (
                    'Generate Cover Letter'
                  )}
                </Button>

                {generatedCoverLetter && (
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Best Results</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Complete your profile for personalized content</li>
              <li>• Include the full job description for better analysis</li>
              <li>• Specify the exact job title and company name</li>
              <li>• Review and customize the generated letter before sending</li>
            </ul>
          </Card>
        </div>

        {/* Preview/Output */}
        <div>
          {!generatedCoverLetter && !isGenerating && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Generated Cover Letter</h2>
              </div>
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>Your cover letter will appear here</p>
                <p className="text-sm mt-2">Fill in the job details and click &quot;Generate Cover Letter&quot;</p>
              </div>
            </Card>
          )}

          {isGenerating && (
            <Card className="p-6">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing job and crafting your cover letter...</p>
                <p className="text-sm text-gray-500 mt-2">This typically takes 10-20 seconds</p>
              </div>
            </Card>
          )}

          {generatedCoverLetter && (
            <CoverLetterEditor
              content={generatedCoverLetter}
              editable={true}
              onSave={handleSaveCoverLetter}
            />
          )}
        </div>
      </div>
      </PageContainer>
    </>
  );
}
