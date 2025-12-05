'use client';

/**
 * Unified Generate Page
 * Full-width tabbed interface for generating both resumes and cover letters
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button, Card, Textarea, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { CoverLetterEditor } from '@/components/cover-letter';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { ExternalLink } from 'lucide-react';
import type { Resume } from '@/lib/validations/jsonresume';
interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
}

interface Model {
  id: string;
  name: string;
  description: string;
  providerId: string;
  providerType: string;
}

interface GeneratedResume {
  id: string;
  content: Resume;
  metadata: {
    generatedAt: string;
    model?: string;
    totalTokens?: number;
    processingTime?: number;
  };
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Common state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Resume generation state
  const [resumeJobDescription, setResumeJobDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedResumeProfileId, setSelectedResumeProfileId] = useState<string>('');
  const [selectedResumeModelId, setSelectedResumeModelId] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);

  // Resume progress streaming state
  const [useStreaming] = useState(true);
  const [progressStep, setProgressStep] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Cover letter only generation state
  const [coverLetterJobDescription, setCoverLetterJobDescription] = useState('');
  const [coverLetterPersonalInstructions, setCoverLetterPersonalInstructions] = useState('');
  const [selectedCoverLetterProfileId, setSelectedCoverLetterProfileId] = useState<string>('');
  const [selectedCoverLetterModelId, setSelectedCoverLetterModelId] = useState<string>('');
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/template');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
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

  // Load profiles and models on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Load profiles and models in parallel
        const [profilesRes, modelsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/settings/api-providers/models'),
        ]);

        if (profilesRes.ok) {
          const data = await profilesRes.json();
          setProfiles(data);
          const defaultProfile = data.find((p: Profile) => p.isDefault);
          if (defaultProfile) {
            setSelectedResumeProfileId(defaultProfile.id);
            setSelectedCoverLetterProfileId(defaultProfile.id);
          } else if (data.length > 0) {
            setSelectedResumeProfileId(data[0].id);
            setSelectedCoverLetterProfileId(data[0].id);
          }
        }

        if (modelsRes.ok) {
          const data = await modelsRes.json();
          setModels(data.allModels || []);
          if (data.allModels && data.allModels.length > 0) {
            setSelectedResumeModelId(data.allModels[0].id);
            setSelectedCoverLetterModelId(data.allModels[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);



  const handleGenerateResume = async () => {
    if (resumeJobDescription.length < 50) {
      setResumeError('Job description must be at least 50 characters long');
      toast.error('Job description must be at least 50 characters long');
      return;
    }

    if (!selectedResumeProfileId) {
      setResumeError('Please select a profile');
      toast.error('Please select a profile');
      return;
    }

    setIsGeneratingResume(true);
    setResumeError(null);
    setGeneratedResume(null);
    setProgressStep('');
    setProgressMessage('');
    setProgressPercent(0);

    try {
      const response = await fetch('/api/resume/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: resumeJobDescription,
          profileId: selectedResumeProfileId,
          modelId: selectedResumeModelId || undefined,
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

              case 'complete': {
                setProgressStep('complete');
                setProgressMessage('Resume generated successfully!');
                setProgressPercent(100);
                setGeneratedResume(eventData.resume);
                setGeneratedResumeId(eventData.resumeId);
                
                // Build description for toast
                let toastDescription = 'Your optimized resume is ready.';
                if (eventData.jobTitle) {
                  toastDescription = eventData.companyName
                    ? `Resume for ${eventData.jobTitle} at ${eventData.companyName}`
                    : `Resume for ${eventData.jobTitle}`;
                }
                
                // Show toast with action to view resume
                toast.success('Resume generated successfully!', {
                  description: toastDescription,
                  action: {
                    label: 'View Resume',
                    onClick: () => {
                      globalThis.location.href = `/resumes/${eventData.resumeId}/edit`;
                    },
                  },
                  duration: 8000,
                });
                break;
              }

              case 'error':
                throw new Error(eventData.message || 'Generation failed');
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setResumeError(errorMessage);
      toast.error(errorMessage);
      setProgressStep('');
      setProgressMessage('');
      setProgressPercent(0);
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (coverLetterJobDescription.length < 50) {
      setCoverLetterError('Job description must be at least 50 characters long');
      toast.error('Job description must be at least 50 characters long');
      return;
    }

    if (profiles.length === 0) {
      setCoverLetterError('No profiles found. Please create a profile first.');
      toast.error('No profiles found. Please create a profile first.');
      return;
    }

    // Use the selected profile ID, or fall back to the first profile if somehow not set
    const profileId = selectedCoverLetterProfileId || profiles[0]?.id;

    if (!profileId) {
      setCoverLetterError('Please select a profile');
      toast.error('Please select a profile');
      return;
    }

    setIsGeneratingCoverLetter(true);
    setCoverLetterError(null);
    setGeneratedCoverLetter(null);

    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: coverLetterJobDescription,
          personalInstructions: coverLetterPersonalInstructions.trim() || undefined,
          profileId: profileId,
          modelId: selectedCoverLetterModelId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate cover letter');
      }

      const data = await response.json();
      setGeneratedCoverLetter(data.coverLetter);
      
      // Show toast with action to view cover letter
      toast.success('Cover letter generated successfully!', {
        description: 'Your cover letter is ready to view and edit.',
        action: data.coverLetterId ? {
          label: 'View Cover Letter',
          onClick: () => {
            globalThis.location.href = `/cover-letters/${data.coverLetterId}`;
          },
        } : undefined,
        duration: 8000,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate cover letter';
      setCoverLetterError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleResetCoverLetter = () => {
    setCoverLetterJobDescription('');
    setCoverLetterPersonalInstructions('');
    setGeneratedCoverLetter(null);
    setCoverLetterError(null);
  };

  const handleSaveCoverLetter = async (content: string) => {
    setGeneratedCoverLetter(content);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Tabs defaultValue={tabParam === 'cover-letter' ? 'cover-letter' : 'resume'} className="h-full flex flex-col">
        {/* Tab Header */}
        <div className="border-b bg-background px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Generate</h1>
              <p className="text-sm text-muted-foreground">Create tailored resumes and cover letters with AI</p>
            </div>
            <TabsList>
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-auto">
          {/* Resume Tab */}
          <TabsContent value="resume" className="h-full m-0 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Input Section */}
              <div className="overflow-auto">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Job Details</h2>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="resumeJobDescription" className="block text-sm font-medium mb-2">
                        Job Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="resumeJobDescription"
                        value={resumeJobDescription}
                        onChange={(e) => setResumeJobDescription(e.target.value)}
                        placeholder="Paste the full job description here (including job title and company name)..."
                        rows={16}
                        className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                        disabled={isGeneratingResume}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {resumeJobDescription.length} / 50 characters minimum
                      </p>
                    </div>

                    {/* Profile Selection */}
                    {profiles.length > 0 && (
                      <div>
                        <label htmlFor="resumeProfile" className="block text-sm font-medium mb-2">
                          Source Profile <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="resumeProfile"
                          value={selectedResumeProfileId}
                          onChange={(e) => setSelectedResumeProfileId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          disabled={isGeneratingResume}
                        >
                          {profiles.map((profile) => (
                            <option className='bg-background text-foreground' key={profile.id} value={profile.id}>
                              {profile.name} {profile.isDefault ? '(Default)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Select which profile to use as the source for your resume
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
                          disabled={isGeneratingResume}
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

                    {/* AI Model Selection */}
                    {isLoadingData ? (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm text-muted-foreground">Loading AI providers...</span>
                        </div>
                      </div>
                    ) : models.length > 0 ? (
                      <div>
                        <label htmlFor="resumeModel" className="block text-sm font-medium mb-2">
                          AI Model <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="resumeModel"
                          value={selectedResumeModelId}
                          onChange={(e) => setSelectedResumeModelId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          disabled={isGeneratingResume}
                        >
                          {models.map((model) => (
                            <option className='bg-background text-foreground' key={model.id} value={model.id}>
                              {model.name} ({model.providerType})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {models.find(m => m.id === selectedResumeModelId)?.description}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          ⚠️ No AI providers configured. Please add an API key in{' '}
                          <Link href="/settings/api-keys" className="underline font-medium">
                            Settings → API Keys
                          </Link>{' '}
                          to generate resumes.
                        </p>
                      </div>
                    )}

                    {resumeError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{resumeError}</p>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {isGeneratingResume && useStreaming && progressPercent > 0 && (
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
                      onClick={handleGenerateResume}
                      disabled={isLoadingData || isGeneratingResume || resumeJobDescription.length < 50 || !selectedResumeProfileId || models.length === 0}
                      className="w-full"
                    >
                      {isLoadingData ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : isGeneratingResume ? (
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
              <div className="overflow-auto">
                {generatedResume && generatedResumeId ? (
                  <div className="space-y-6">
                    {/* Action Button */}
                    <div className="flex justify-end">
                      <Link href={`/resumes/${generatedResumeId}/edit`}>
                        <Button variant="default">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in Resume Editor
                        </Button>
                      </Link>
                    </div>

                    <ResumePreview
                      resumeData={generatedResume.content}
                      resumeId={generatedResumeId}
                      onTemplateChange={() => { }}
                      showTemplateSelector={true}
                      showCard={true}
                      previewKey={Number(generatedResumeId)}
                    />
                  </div>
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
          </TabsContent>

          {/* Cover Letter Tab */}
          <TabsContent value="cover-letter" className="h-full m-0 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <div>
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Job Details</h2>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="coverLetterJobDescription" className="block text-sm font-medium mb-2">
                        Job Description *
                      </label>
                      <Textarea
                        id="coverLetterJobDescription"
                        value={coverLetterJobDescription}
                        onChange={(e) => setCoverLetterJobDescription(e.target.value)}
                        placeholder="Paste the full job description here (including job title and company name)..."
                        rows={10}
                        className="w-full"
                        disabled={isGeneratingCoverLetter}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 50 characters ({coverLetterJobDescription.length}/50)
                      </p>
                    </div>

                    {/* Profile Selection */}
                    {profiles.length > 0 && (
                      <div>
                        <label htmlFor="coverLetterProfile" className="block text-sm font-medium mb-2">
                          Source Profile <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="coverLetterProfile"
                          value={selectedCoverLetterProfileId}
                          onChange={(e) => setSelectedCoverLetterProfileId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          disabled={isGeneratingCoverLetter}
                        >
                          {profiles.map((profile) => (
                            <option className='bg-background text-foreground' key={profile.id} value={profile.id}>
                              {profile.name} {profile.isDefault ? '(Default)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Select which profile to use as the source for your cover letter
                        </p>
                      </div>
                    )}

                    {/* AI Model Selection */}
                    {isLoadingData ? (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm text-muted-foreground">Loading AI providers...</span>
                        </div>
                      </div>
                    ) : models.length > 0 ? (
                      <div>
                        <label htmlFor="coverLetterModel" className="block text-sm font-medium mb-2">
                          AI Model <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="coverLetterModel"
                          value={selectedCoverLetterModelId}
                          onChange={(e) => setSelectedCoverLetterModelId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          disabled={isGeneratingCoverLetter}
                        >
                          {models.map((model) => (
                            <option className='bg-background text-foreground' key={`${model.providerId}-${model.id}`} value={model.id}>
                              {model.name} ({model.providerType})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {models.find(m => m.id === selectedCoverLetterModelId)?.description}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          ⚠️ No AI providers configured. Please add an API key in{' '}
                          <Link href="/settings/api-keys" className="underline font-medium">
                            Settings → API Keys
                          </Link>{' '}
                          to generate cover letters.
                        </p>
                      </div>
                    )}

                    <div>
                      <label htmlFor="coverLetterPersonalInstructions" className="block text-sm font-medium mb-2">
                        Personal Instructions (Optional)
                      </label>
                      <Textarea
                        id="coverLetterPersonalInstructions"
                        value={coverLetterPersonalInstructions}
                        onChange={(e) => setCoverLetterPersonalInstructions(e.target.value)}
                        placeholder="Add any specific instructions for your cover letter (e.g., 'Emphasize my leadership experience', 'Use an enthusiastic tone', 'Mention my passion for AI')..."
                        rows={4}
                        className="w-full"
                        disabled={isGeneratingCoverLetter}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Provide custom guidance to personalize your cover letter
                      </p>
                    </div>

                    {/* Warning if no profiles */}
                    {profiles.length === 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          ⚠️ No profiles found. Please{' '}
                          <Link href="/profile" className="underline font-medium">
                            create a profile
                          </Link>{' '}
                          before generating a cover letter.
                        </p>
                      </div>
                    )}

                    {coverLetterError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{coverLetterError}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={handleGenerateCoverLetter}
                        disabled={isLoadingData || isGeneratingCoverLetter || coverLetterJobDescription.length < 50 || profiles.length === 0 || models.length === 0}
                        className="flex-1"
                      >
                        {isLoadingData ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                          </>
                        ) : isGeneratingCoverLetter ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          'Generate Cover Letter'
                        )}
                      </Button>

                      {generatedCoverLetter && (
                        <Button
                          variant="ghost"
                          onClick={handleResetCoverLetter}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Preview/Output */}
              <div>
                {!generatedCoverLetter && !isGeneratingCoverLetter && (
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

                {isGeneratingCoverLetter && (
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
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
