'use client';

/**
 * Refactored Generate Page
 * Full-width tabbed interface for generating both resumes and cover letters.
 * Uses the new conversational AI system hooks.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Callout, Spinner } from '@/components/shared';
import { Button, Card, Textarea, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { CoverLetterEditor } from '@/components/cover-letter';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { ExternalLink, Sparkles, FileText, Send, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { ROUTES } from '@/lib/constants';
import { apiV1, type ApiProvider, type ProfileListItem, type TemplateListResponseDto } from '@/lib/client';
import { useComponentLogger } from '@/hooks';
import type { TemplateBase } from '@/lib/types/template';
import { useResumeGeneration, useCoverLetterGeneration } from '@/components/ai-enhance/hooks';

export default function GeneratePage() {
  const log = useComponentLogger('GeneratePage');
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Common metadata state
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [templates, setTemplates] = useState<TemplateBase[]>([]);
  const [hasAIProviders, setHasAIProviders] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Form state
  const [selectedResumeProfileId, setSelectedResumeProfileId] = useState<string>('');
  const [selectedCoverLetterProfileId, setSelectedCoverLetterProfileId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [resumeJobDescription, setResumeJobDescription] = useState('');
  const [coverLetterJobDescription, setCoverLetterJobDescription] = useState('');
  const [coverLetterPersonalInstructions, setCoverLetterPersonalInstructions] = useState('');
  
  // Model selection
  const [selectedResumeModelId, setSelectedResumeModelId] = useState<string>('');
  const [selectedCoverLetterModelId, setSelectedCoverLetterModelId] = useState<string>('');

  // Generation hooks
  const { 
    generate: generateResume, 
    resume: generatedResume, 
    matchScore,
    suggestions,
    isLoading: isGeneratingResume, 
    error: resumeError,
    reset: resetResume
  } = useResumeGeneration();

  const {
    generate: generateCoverLetter,
    coverLetter: generatedCoverLetter,
    isLoading: isGeneratingCoverLetter,
    error: coverLetterError,
    reset: resetCoverLetter
  } = useCoverLetterGeneration();

  // Load initial data
  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const [profilesResult, providersResult, templatesResult] = await Promise.all([
          apiV1.PROFILE.LIST.get<ProfileListItem[]>(),
          apiV1.SETTINGS.API_PROVIDERS.get<ApiProvider[]>(),
          apiV1.TEMPLATE.LIST.get<TemplateListResponseDto<TemplateBase>>(),
        ]);

        if (!profilesResult.error && profilesResult.data) {
          setProfiles(profilesResult.data);
          const defaultProfile = profilesResult.data.find(p => p.isDefault) || profilesResult.data[0];
          if (defaultProfile) {
            setSelectedResumeProfileId(defaultProfile.id);
            setSelectedCoverLetterProfileId(defaultProfile.id);
          }
        }

        if (!providersResult.error && providersResult.data) {
          setProviders(providersResult.data);
          const activeProviders = providersResult.data.filter(p => p.isActive);
          setHasAIProviders(activeProviders.length > 0);
          
          if (activeProviders.length > 0) {
            const firstModelId = activeProviders[0].models?.[0]?.id || '';
            setSelectedResumeModelId(firstModelId);
            setSelectedCoverLetterModelId(firstModelId);
          }
        }

        if (!templatesResult.error && templatesResult.data) {
          setTemplates(templatesResult.data.templates);
          if (templatesResult.data.templates.length > 0) {
            setSelectedTemplateId(templatesResult.data.templates[0].id);
          }
        }
      } catch (err) {
        log.error('Failed to load metadata', err);
        toast.error('Failed to load configuration');
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, [log]);

  const handleGenerateResume = useCallback(async () => {
    if (resumeJobDescription.length < 50) {
      toast.error('Job description must be at least 50 characters');
      return;
    }
    
    await generateResume({
      jobDescription: resumeJobDescription,
      personalInstructions: '', // Could add field for this
    });
  }, [generateResume, resumeJobDescription]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (coverLetterJobDescription.length < 50) {
      toast.error('Job description must be at least 50 characters');
      return;
    }

    await generateCoverLetter({
      jobDescription: coverLetterJobDescription,
      personalInstructions: coverLetterPersonalInstructions,
    });
  }, [generateCoverLetter, coverLetterJobDescription, coverLetterPersonalInstructions]);

  const activeProviders = providers.filter(p => p.isActive);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Tabs defaultValue={tabParam === 'cover-letter' ? 'cover-letter' : 'resume'} className="h-full flex flex-col">
        <div className="flex items-end justify-between border-b px-6 py-2">
          <div className="flex-1">
            <PageHeader
              title="Generate"
              description="Create tailored resumes and cover letters with AI"
            />
          </div>
          <TabsList className="mb-4">
            <TabsTrigger value="resume" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="cover-letter" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Cover Letter
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Resume Tab */}
          <TabsContent value="resume" className="h-full m-0 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full max-w-[1600px] mx-auto">
              <div className="space-y-6 overflow-auto pb-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Target Job</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Job Description</label>
                      <Textarea
                        value={resumeJobDescription}
                        onChange={(e) => setResumeJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={12}
                        className="font-mono text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {resumeJobDescription.length}/50 characters minimum
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">Profile</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                          value={selectedResumeProfileId}
                          onChange={(e) => setSelectedResumeProfileId(e.target.value)}
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-2">Template</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                        >
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">AI Model</label>
                      <SearchableSelect
                        value={selectedResumeModelId}
                        onValueChange={setSelectedResumeModelId}
                        options={activeProviders.flatMap(p => 
                          (p.models || []).map(m => ({ 
                            value: m.id, 
                            label: `${p.name}: ${m.name || m.id}` 
                          }))
                        )}
                        placeholder="Select AI model"
                      />
                    </div>

                    {!hasAIProviders && !isLoadingMetadata && (
                      <Callout variant="warning">
                        No AI providers configured. Go to <Link href={ROUTES.SETTINGS_API_KEYS} className="underline">Settings</Link>.
                      </Callout>
                    )}

                    {resumeError && (
                      <Callout variant="danger">
                        {resumeError}
                      </Callout>
                    )}

                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled={isGeneratingResume || resumeJobDescription.length < 50 || !hasAIProviders}
                      onClick={handleGenerateResume}
                    >
                      {isGeneratingResume ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Resume
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {matchScore !== null && (
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">ATS Match Score</span>
                      <span className="text-2xl font-bold text-primary">{matchScore}%</span>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold mb-2">Optimization Suggestions:</p>
                        <ul className="text-xs space-y-1 list-disc pl-4 text-muted-foreground">
                          {suggestions.slice(0, 3).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )}
              </div>

              <div className="h-full overflow-auto">
                {generatedResume ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={ROUTES.RESUMES}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View All Resumes
                        </Link>
                      </Button>
                    </div>
                    <ResumePreview
                      resumeData={generatedResume}
                      showTemplateSelector={false}
                      showCard={true}
                    />
                  </div>
                ) : (
                  <Card className="h-full flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Preview Area</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Fill in the job details on the left and click generate to see your tailored resume here.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Cover Letter Tab */}
          <TabsContent value="cover-letter" className="h-full m-0 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full max-w-[1600px] mx-auto">
              <div className="space-y-6 overflow-auto pb-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Letter Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Job Description</label>
                      <Textarea
                        value={coverLetterJobDescription}
                        onChange={(e) => setCoverLetterJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={10}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">Personal Instructions (Tone, Focus, etc.)</label>
                      <Textarea
                        value={coverLetterPersonalInstructions}
                        onChange={(e) => setCoverLetterPersonalInstructions(e.target.value)}
                        placeholder="e.g. Use a professional but enthusiastic tone. Focus on my project management skills."
                        rows={3}
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">Profile</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                          value={selectedCoverLetterProfileId}
                          onChange={(e) => setSelectedCoverLetterProfileId(e.target.value)}
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-2">Model</label>
                        <SearchableSelect
                          value={selectedCoverLetterModelId}
                          onValueChange={setSelectedCoverLetterModelId}
                          options={activeProviders.flatMap(p => 
                            (p.models || []).map(m => ({ 
                              value: m.id, 
                              label: `${p.name}: ${m.name || m.id}` 
                            }))
                          )}
                          placeholder="Select model"
                        />
                      </div>
                    </div>

                    {coverLetterError && (
                      <Callout variant="danger">
                        {coverLetterError}
                      </Callout>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1" 
                        size="lg"
                        disabled={isGeneratingCoverLetter || coverLetterJobDescription.length < 50 || !hasAIProviders}
                        onClick={handleGenerateCoverLetter}
                      >
                        {isGeneratingCoverLetter ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Letter
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" onClick={resetCoverLetter}>Reset</Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="h-full overflow-auto">
                {generatedCoverLetter ? (
                  <CoverLetterEditor
                    content={generatedCoverLetter}
                    editable={true}
                    onSave={async (content) => {
                      log.debug('Saving generated cover letter', { contentLength: content.length });
                    }}
                  />
                ) : (
                  <Card className="h-full flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Send className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Cover Letter Preview</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Your generated cover letter will appear here. You can edit it directly once generated.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
