'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface GeneratedResume {
  id: string;
  content: {
    personalInfo: {
      name: string;
      email: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      github?: string;
    };
    summary: string;
    experience: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description: string;
      bulletPoints: string[];
    }>;
    education: Array<{
      school: string;
      degree: string;
      field: string;
      gpa?: string;
      startDate: string;
      endDate?: string;
    }>;
    skills: string[];
    metadata: {
      generatedAt: string;
      modelUsed: string;
      tokensUsed: number;
      jobTitle: string;
      companyName: string;
    };
  };
}

export default function GeneratePage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);

  const handleGenerate = async () => {
    if (jobDescription.length < 50) {
      setError('Job description must be at least 50 characters long');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedResume(null);

    try {
      const response = await fetch('/api/resumes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          jobTitle: jobTitle || undefined,
          companyName: companyName || undefined,
          generateCoverLetter,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details?.[0]?.message || 'Failed to generate resume');
      }

      setGeneratedResume(data.resume);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (startDate: string, endDate?: string, current?: boolean) => {
    if (current) return `${startDate} - Present`;
    if (endDate) return `${startDate} - ${endDate}`;
    return startDate;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generate Resume</h1>
        <p className="text-gray-600">
          Paste a job description and let AI create a tailored resume for you
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Job Details</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium mb-2">
                  Job Title (Optional)
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                  Company Name (Optional)
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Tech Corp"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium mb-2">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={12}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  disabled={isGenerating}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {jobDescription.length} / 50 characters minimum
                </p>
              </div>

              {/* Cover Letter Option */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="coverLetter"
                  checked={generateCoverLetter}
                  onChange={(e) => setGenerateCoverLetter(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isGenerating}
                />
                <label htmlFor="coverLetter" className="text-sm text-gray-700 cursor-pointer">
                  Generate cover letter (optional)
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || jobDescription.length < 50}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Resume...
                  </>
                ) : (
                  '✨ Generate Resume'
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Preview Section */}
        <div>
          {generatedResume ? (
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Generated Resume</h2>
                <Button
                  onClick={() => router.push(`/resumes`)}
                  variant="secondary"
                  size="sm"
                >
                  View All Resumes
                </Button>
              </div>

              <div className="space-y-6">
                {/* Personal Info */}
                <div className="border-b pb-4">
                  <h3 className="text-2xl font-bold">{generatedResume.content.personalInfo.name}</h3>
                  <p className="text-gray-600">{generatedResume.content.personalInfo.email}</p>
                  {generatedResume.content.personalInfo.phone && (
                    <p className="text-gray-600">{generatedResume.content.personalInfo.phone}</p>
                  )}
                  {generatedResume.content.personalInfo.location && (
                    <p className="text-gray-600">{generatedResume.content.personalInfo.location}</p>
                  )}
                  <div className="flex gap-3 mt-2">
                    {generatedResume.content.personalInfo.linkedin && (
                      <a href={generatedResume.content.personalInfo.linkedin} className="text-sm text-blue-600 hover:underline">
                        LinkedIn
                      </a>
                    )}
                    {generatedResume.content.personalInfo.github && (
                      <a href={generatedResume.content.personalInfo.github} className="text-sm text-blue-600 hover:underline">
                        GitHub
                      </a>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {generatedResume.content.summary && (
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Professional Summary</h4>
                    <p className="text-gray-700">{generatedResume.content.summary}</p>
                  </div>
                )}

                {/* Experience */}
                {generatedResume.content.experience.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Experience</h4>
                    <div className="space-y-4">
                      {generatedResume.content.experience.map((exp, idx) => (
                        <div key={idx} className="border-l-2 border-gray-200 pl-4">
                          <h5 className="font-semibold">{exp.title}</h5>
                          <p className="text-gray-600">{exp.company}</p>
                          <p className="text-sm text-gray-500 mb-2">
                            {formatDate(exp.startDate, exp.endDate, exp.current)}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">{exp.description}</p>
                          {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                            <ul className="list-disc list-inside space-y-1">
                              {exp.bulletPoints.map((bullet, bidx) => (
                                <li key={bidx} className="text-sm text-gray-700">{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {generatedResume.content.education.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Education</h4>
                    <div className="space-y-3">
                      {generatedResume.content.education.map((edu, idx) => (
                        <div key={idx}>
                          <h5 className="font-semibold">{edu.degree} in {edu.field}</h5>
                          <p className="text-gray-600">{edu.school}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(edu.startDate, edu.endDate)}
                            {edu.gpa && ` • GPA: ${edu.gpa}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {generatedResume.content.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedResume.content.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="border-t pt-4 mt-6">
                  <p className="text-xs text-gray-500">
                    Generated on {new Date(generatedResume.content.metadata.generatedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Model: {generatedResume.content.metadata.modelUsed} • 
                    Tokens: {generatedResume.content.metadata.tokensUsed}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <div className="py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No resume generated yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fill in the job details and click Generate to create your tailored resume
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
