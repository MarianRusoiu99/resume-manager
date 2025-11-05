'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card } from '@/components/ui';
import { ResumePreviewWithActions } from '@/components/resume/ResumePreviewWithActions';
import { CoverLetterEditor } from '@/components/cover-letter';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface GeneratedResume {
  id: string;
  content: {
    basics?: {
      name?: string;
      email?: string;
      phone?: string;
      url?: string;
      summary?: string;
      location?: {
        address?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        countryCode?: string;
      };
      profiles?: Array<{
        network?: string;
        username?: string;
        url?: string;
      }>;
    };
    work?: Array<{
      name?: string;
      position?: string;
      url?: string;
      startDate?: string;
      endDate?: string;
      summary?: string;
      highlights?: string[];
    }>;
    education?: Array<{
      institution?: string;
      url?: string;
      area?: string;
      studyType?: string;
      startDate?: string;
      endDate?: string;
      score?: string;
      courses?: string[];
    }>;
    skills?: Array<{
      name?: string;
      level?: string;
      keywords?: string[];
    }>;
    certificates?: Array<{
      name?: string;
      date?: string;
      issuer?: string;
      url?: string;
    }>;
    projects?: Array<{
      name?: string;
      description?: string;
      highlights?: string[];
      keywords?: string[];
      startDate?: string;
      endDate?: string;
      url?: string;
    }>;
    [key: string]: unknown;
  };
  metadata: {
    generatedAt: string;
    model?: string;
    totalTokens?: number;
    processingTime?: number;
  };
}

export default function GeneratePage() {
  const [jobDescription, setJobDescription] = useState('');
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);
  const [personalInstructions, setPersonalInstructions] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  
  // Progress streaming state
  const [useStreaming] = useState(true);
  const [progressStep, setProgressStep] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
          // Select first template by default
          if (data.templates && data.templates.length > 0) {
            setSelectedTemplateId(data.templates[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    loadTemplates();
  }, []);

  const handleGenerate = async () => {
    if (jobDescription.length < 50) {
      setError('Job description must be at least 50 characters long');
      toast.error('Job description must be at least 50 characters long');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedResume(null);
    setGeneratedCoverLetter(null);

    try {
      const response = await fetch('/api/resumes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          generateCoverLetter,
          personalInstructions: personalInstructions.trim() || undefined,
          templateId: selectedTemplateId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details?.[0]?.message || 'Failed to generate resume');
      }

      setGeneratedResume(data.resume);
      setGeneratedResumeId(data.resumeId); // Save the resume ID (API returns resumeId)
      setGeneratedCoverLetter(data.coverLetter || null); // Save the cover letter if generated
      toast.success('Resume generated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWithStreaming = async () => {
    if (jobDescription.length < 50) {
      setError('Job description must be at least 50 characters long');
      toast.error('Job description must be at least 50 characters long');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedResume(null);
    setGeneratedCoverLetter(null);
    setProgressStep('');
    setProgressMessage('');
    setProgressPercent(0);

    try {
      const response = await fetch('/api/resumes/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          generateCoverLetter,
          personalInstructions: personalInstructions.trim() || undefined,
          templateId: selectedTemplateId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate resume');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream not available');
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);
          
          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const eventData = JSON.parse(dataMatch[1]);
            
            switch (eventType) {
              case 'connected':
                console.log('Connected to stream');
                break;
              
              case 'start':
                setProgressStep('init');
                setProgressMessage('Starting generation...');
                setProgressPercent(0);
                break;
              
              case 'progress':
                setProgressStep(eventData.step);
                setProgressMessage(eventData.message);
                setProgressPercent(eventData.progress);
                break;
              
              case 'complete':
                setProgressStep('complete');
                setProgressMessage('Resume generated successfully!');
                setProgressPercent(100);
                setGeneratedResume(eventData.resume);
                setGeneratedResumeId(eventData.resumeId); // Save the resume ID (API returns resumeId)
                setGeneratedCoverLetter(eventData.coverLetter || null); // Save the cover letter if generated
                toast.success('Resume generated successfully!');
                break;
              
              case 'error':
                throw new Error(eventData.message || 'Generation failed');
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      setProgressStep('');
      setProgressMessage('');
      setProgressPercent(0);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler for when resume is deleted from preview component
  const handleResumeDeleted = () => {
    setGeneratedResume(null);
    setGeneratedResumeId(null);
    setGeneratedCoverLetter(null);
  };

  const handleSaveCoverLetter = async (content: string) => {
    // Update the local state with the edited content
    setGeneratedCoverLetter(content);
  };

  return (
    <>
      <PageHeader
        title="Generate Resume"
        description="Paste a job description and let AI create a tailored resume for you"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Generate" },
        ]}
      />
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Job Details</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium mb-2">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here (including job title and company name)..."
                  rows={16}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm"
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
                  className="w-4 h-4 text-foreground border-gray-300 rounded "
                  disabled={isGenerating}
                />
                <label htmlFor="coverLetter" className="text-sm text-gray-700 cursor-pointer">
                  Generate cover letter (optional)
                </label>
              </div>

              {/* Personal Instructions (for cover letter) */}
              {generateCoverLetter && (
                <div>
                  <label htmlFor="personalInstructions" className="block text-sm font-medium mb-2">
                    Personal Instructions (Optional)
                  </label>
                  <textarea
                    id="personalInstructions"
                    value={personalInstructions}
                    onChange={(e) => setPersonalInstructions(e.target.value)}
                    placeholder="Add specific instructions for your cover letter (e.g., 'Emphasize my leadership experience', 'Use an enthusiastic tone')..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide custom guidance to personalize your cover letter
                  </p>
                </div>
              )}

              {/* Template Selection */}
              {templates.length > 0 && (
                <div>
                  <label htmlFor="template" className="block text-sm font-medium mb-2">
                    Resume Template
                  </label>
                  <select
                    id="template"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={isGenerating}
                  >
                    {templates.map((template) => (
                      <option className='bg-background text-foreground' key={template.id} value={template.id}>
                        {template.name} - {template.category}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {templates.find(t => t.id === selectedTemplateId)?.description}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Progress Bar */}
              {isGenerating && useStreaming && progressPercent > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-900">{progressStep}</span>
                    <span className="text-blue-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-700">{progressMessage}</p>
                </div>
              )}

              <Button
                onClick={useStreaming ? handleGenerateWithStreaming : handleGenerate}
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
          {generatedResume && generatedResumeId ? (
            <ResumePreviewWithActions
              resumeId={generatedResumeId}
              onDelete={handleResumeDeleted}
            />
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

      {/* Cover Letter Section - Full Width Below Resume */}
      {generatedCoverLetter && (
        <div className="mt-6">
          <CoverLetterEditor
            content={generatedCoverLetter}
            editable={true}
            resumeId={generatedResumeId || undefined}
            onSave={handleSaveCoverLetter}
          />
        </div>
      )}
      </PageContainer>
    </>
  );
}
