'use client';

/**
 * Unified Generate Page
 * Full-width tabbed interface for generating both resumes and cover letters
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Callout, Spinner } from '@/components/shared';
import { Button, Card, Textarea, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { CoverLetterEditor } from '@/components/cover-letter';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { ExternalLink } from 'lucide-react';
import type { Resume } from '@/lib/validations/jsonresume';
import { PageHeader } from '@/components/layout';
import { ROUTES } from '@/lib/constants';
import { apiV1, type ApiProvider, type ProfileListItem, type TemplateListResponseDto } from '@/lib/client';
import { useComponentLogger } from '@/hooks';
import type { TemplateBase } from '@/lib/types/template';

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
  const log = useComponentLogger('GeneratePage');
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Common state
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [hasAIProviders, setHasAIProviders] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Resume generation state
  const [resumeJobDescription, setResumeJobDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedResumeProfileId, setSelectedResumeProfileId] = useState<string>('');
  const [templates, setTemplates] = useState<TemplateBase[]>([]);
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
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      const result = await apiV1.TEMPLATE.LIST.get<TemplateListResponseDto<TemplateBase>>();
      if (result.error || !result.data) {
        log.error('Failed to load templates', undefined, { error: result.error });
        return;
      }

      setTemplates(result.data.templates);
      if (result.data.templates.length > 0) {
        setSelectedTemplateId(result.data.templates[0].id);
      }
    };

    loadTemplates();
  }, [log]);

  // Load profiles and check for AI providers on mount
  useEffect(() => {
    type ProfileListApiItem = { id: string; name: string; isDefault: boolean };

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [profilesResult, providersResult] = await Promise.all([
          apiV1.PROFILE.LIST.get<ProfileListApiItem[]>(),
          apiV1.SETTINGS.API_PROVIDERS.get<ApiProvider[]>(),
        ]);

        if (!profilesResult.error && profilesResult.data) {
          const profileItems: ProfileListItem[] = profilesResult.data.map((p) => ({
            id: p.id,
            name: p.name,
            isDefault: p.isDefault,
          }));

          setProfiles(profileItems);

          const defaultProfile = profileItems.find((p) => p.isDefault);
          if (defaultProfile) {
            setSelectedResumeProfileId(defaultProfile.id);
            setSelectedCoverLetterProfileId(defaultProfile.id);
          } else if (profileItems.length > 0) {
            setSelectedResumeProfileId(profileItems[0].id);
            setSelectedCoverLetterProfileId(profileItems[0].id);
          }
        }

        if (!providersResult.error && providersResult.data) {
          setHasAIProviders(providersResult.data.some((p) => p.isActive));
        }
      } catch (err) {
        log.error('Failed to load data', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [log]);



  const validateResumeInput = (): boolean => {
    if (resumeJobDescription.length < 50) {
      const errorMsg = 'Job description must be at least 50 characters long';
      setResumeError(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    if (!selectedResumeProfileId) {
      const errorMsg = 'Please select a profile';
      setResumeError(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    return true;
  };

  const resetResumeProgress = () => {
    setProgressStep('');
    setProgressMessage('');
    setProgressPercent(0);
  };

  const handleStreamEvent = (eventType: string, eventData: unknown) => {
    const data = eventData as {
      step?: string;
      message?: string;
      progress?: number;
      resume?: GeneratedResume['content'];
      resumeId?: string;
      jobTitle?: string;
      companyName?: string;
      error?: string;
    };

    switch (eventType) {
      case 'connected':
        log.debug('Connected to stream');
        break;

      case 'start':
        setProgressStep('init');
        setProgressMessage('Starting generation...');
        setProgressPercent(0);
        break;

      case 'progress':
        setProgressStep(data.step || '');
        setProgressMessage(data.message || '');
        setProgressPercent(data.progress || 0);
        break;

      case 'complete': {
        setProgressStep('complete');
        setProgressMessage('Resume generated successfully!');
        setProgressPercent(100);
        if (data.resume) {
          setGeneratedResume({
            id: data.resumeId || '',
            content: data.resume,
            metadata: {
              generatedAt: new Date().toISOString(),
            },
          });
        } else {
          setGeneratedResume(null);
        }
        setGeneratedResumeId(data.resumeId || null);

        let toastDescription = 'Your optimized resume is ready.';
        if (data.jobTitle) {
          toastDescription = data.companyName
            ? `Resume for ${data.jobTitle} at ${data.companyName}`
            : `Resume for ${data.jobTitle}`;
        }

        toast.success('Resume generated successfully!', {
          description: toastDescription,
          action: {
            label: 'View Resume',
            onClick: () => {
              globalThis.location.href = ROUTES.RESUME_EDIT(data.resumeId!);
            },
          },
          duration: 8000,
        });
        break;
      }

      case 'error':
        throw new Error(data.error || 'Generation failed');
    }
  };

  const processResumeStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
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
          handleStreamEvent(eventType, eventData);
        }
      }
    }
  };

  const handleGenerateResume = async () => {
    if (!validateResumeInput()) {
      return;
    }

    setIsGeneratingResume(true);
    setResumeError(null);
    setGeneratedResume(null);
    resetResumeProgress();

    try {
      const response = await apiV1.RESUME.GENERATE_STREAM.postFetch({
        jobDescription: resumeJobDescription,
        profileId: selectedResumeProfileId,
        templateId: selectedTemplateId || undefined,
      });

       if (!response.ok) {
          throw new Error((await response.text()) || 'Failed to generate resume');
       }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Stream not available');
      }

      await processResumeStream(reader);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setResumeError(errorMessage);
      toast.error(errorMessage);
      resetResumeProgress();
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
      const result = await apiV1.COVER_LETTER.GENERATE.post<{
        coverLetter: string;
        coverLetterId: string;
        metadata: unknown;
      }>({
        jobDescription: coverLetterJobDescription,
        personalInstructions: coverLetterPersonalInstructions,
        profileId,
      });

      if (result.error || !result.data) {
        throw new Error(result.error ?? 'Failed to generate cover letter');
      }

      setGeneratedCoverLetter(result.data.coverLetter);
      
      // Show toast with action to view cover letter
      toast.success('Cover letter generated successfully!', {
        description: 'Your cover letter is ready to view and edit.',
        action: result.data?.coverLetterId
          ? {
              label: 'View Cover Letter',
              onClick: () => {
                globalThis.location.href = `/cover-letters/${result.data?.coverLetterId}`;
              },
            }
          : undefined,
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
        <div className="flex items-end justify-between">
          <PageHeader
            title="Generate"
            description="Create tailored resumes and cover letters with AI"
          />
          <TabsList className="ml-auto mr-6">
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
          </TabsList>
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

                    {/* AI Provider Check */}
                    {!isLoadingData && !hasAIProviders && (
                      <Callout variant="warning" tone="soft" className="p-3">
                        <p>
                          ⚠️ No AI providers configured. Please add an API key in{' '}
                          <Link href={ROUTES.SETTINGS_API_KEYS} className="underline font-medium">
                            Settings → API Keys
                          </Link>{' '}
                          to generate resumes.
                        </p>
                      </Callout>
                    )}

                    {resumeError && (
                      <Callout variant="danger" tone="soft" className="p-3">
                        <p>{resumeError}</p>
                      </Callout>
                    )}

                    {/* Progress Bar */}
                    {isGeneratingResume && useStreaming && progressPercent > 0 && (
                        <Callout className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{progressStep}</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full transition-all duration-300 ease-out"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-xs">{progressMessage}</p>
                        </Callout>
                    )}

              
                    
                    <Button
                      onClick={handleGenerateResume}
                      disabled={isLoadingData || isGeneratingResume || resumeJobDescription.length < 50 || !selectedResumeProfileId || !hasAIProviders}
                      className="w-full"
                    >
                      {(() => {
                        if (isLoadingData) {
                          return (
                            <>
                               <Spinner size="sm" className="-ml-1 mr-3" />
                               Loading...
                            </>
                          );
                        }
                        if (isGeneratingResume) {
                          return (
                            <>
                               <Spinner size="sm" className="-ml-1 mr-3" />
                               Generating Resume...
                            </>
                          );
                        }
                        return '✨ Generate Resume';
                      })()}
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
                      <Link href={ROUTES.RESUME_EDIT(generatedResumeId)}>
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
                    {isLoadingData && (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                           <Spinner size="sm" className="h-4 w-4" />
                          <span className="text-sm text-muted-foreground">Loading...</span>
                        </div>
                      </div>
                    )}

                    {!isLoadingData && !hasAIProviders && (
                      <Callout variant="warning" tone="soft" className="p-3">
                        <p>
                          ⚠️ No AI providers configured. Please add an API key in{' '}
                          <Link href={ROUTES.SETTINGS_API_KEYS} className="underline font-medium">
                            Settings → API Keys
                          </Link>{' '}
                          to generate cover letters.
                        </p>
                      </Callout>
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
                      <Callout variant="warning" tone="soft" className="p-3">
                        <p>
                          ⚠️ No profiles found. Please{' '}
                          <Link href="/profile" className="underline font-medium">
                            create a profile
                          </Link>{' '}
                          before generating a cover letter.
                        </p>
                      </Callout>
                    )}

                    {coverLetterError && (
                      <Callout variant="danger" tone="soft" className="p-3">
                        <p>{coverLetterError}</p>
                      </Callout>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={handleGenerateCoverLetter}
                        disabled={isLoadingData || isGeneratingCoverLetter || coverLetterJobDescription.length < 50 || profiles.length === 0 || !hasAIProviders}
                        className="flex-1"
                      >
                        {isLoadingData && (
                          <>
                             <Spinner size="sm" className="-ml-1 mr-3" />
                             Loading...
                          </>
                        )}
                        {isGeneratingCoverLetter && !isLoadingData && (
                          <>
                             <Spinner size="sm" className="-ml-1 mr-3" />
                             Generating...
                          </>
                        )}
                        {!isLoadingData && !isGeneratingCoverLetter && 'Generate Cover Letter'}
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
                       <Spinner className="mx-auto mb-4" />
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
