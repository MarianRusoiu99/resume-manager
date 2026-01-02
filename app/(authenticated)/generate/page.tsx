'use client';

/**
 * Standardized Generate Page
 * Full-width tabbed interface for generating tailored resumes and cover letters.
 * Uses the unified <Page> component and conversational AI system hooks.
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
import { ExternalLink, Sparkles, FileText, Send, AlertCircle, Save, Download } from 'lucide-react';
import { Page } from '@/components/layout/Page';
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
  } = useResumeGeneration();

  const [isSavingResume, setIsSavingResume] = useState(false);

  const handleSaveResume = async () => {
    if (!generatedResume) return;
    
    setIsSavingResume(true);
    try {
      const result = await apiV1.RESUME.LIST.post({
        resume: generatedResume,
        templateId: selectedTemplateId,
        title: `Tailored Resume - ${new Date().toLocaleDateString()}`,
        jobDescription: resumeJobDescription,
        metadata: {
          matchScore,
          suggestions,
        }
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Resume saved to library');
      }
    } catch (err) {
      toast.error('Failed to save resume');
    } finally {
      setIsSavingResume(false);
    }
  };

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
      personalInstructions: '', 
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
    <Page
      title="Generate Content"
      description="Create tailored resumes and cover letters with AI"
      maxWidth="2xl"
      breadcrumbs={[{ label: 'Generate' }]}
    >
      <Tabs defaultValue={tabParam === 'cover-letter' ? 'cover-letter' : 'resume'} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
          <TabsTrigger value="resume" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Resume
          </TabsTrigger>
          <TabsTrigger value="cover-letter" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Cover Letter
          </TabsTrigger>
        </TabsList>

        <div className="mt-2">
          {/* Resume Tab */}
          <TabsContent value="resume" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Target Job Details</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium block mb-2">Job Description</label>
                      <Textarea
                        value={resumeJobDescription}
                        onChange={(e) => setResumeJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={10}
                        className="font-mono text-xs resize-none"
                      />
                      <div className="flex justify-between items-center mt-1.5">
                        <p className="text-[10px] text-muted-foreground">
                          Min 50 characters: {resumeJobDescription.length}/50
                        </p>
                        {resumeJobDescription.length >= 50 && (
                          <span className="text-[10px] text-green-600 font-medium">Ready</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Profile Source</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={selectedResumeProfileId}
                          onChange={(e) => setSelectedResumeProfileId(e.target.value)}
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Layout Template</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                        >
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">AI Model Preference</label>
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
                        No AI providers configured. Go to <Link href={ROUTES.SETTINGS_API_KEYS} className="underline font-medium">Settings</Link> to add your API keys.
                      </Callout>
                    )}

                    {resumeError && (
                      <Callout variant="danger">
                        {resumeError}
                      </Callout>
                    )}

                    <Button 
                      className="w-full shadow-sm" 
                      size="lg"
                      disabled={isGeneratingResume || resumeJobDescription.length < 50 || !hasAIProviders}
                      onClick={handleGenerateResume}
                    >
                      {isGeneratingResume ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Tailoring Resume...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Tailored Resume
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {matchScore !== null && (
                  <Card className="p-5 bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Optimization Insights</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Match Score</span>
                        <span className="text-2xl font-bold text-primary">{matchScore}%</span>
                      </div>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-primary/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-2">Key Improvement Areas</p>
                        <ul className="text-xs space-y-2">
                          {suggestions.slice(0, 3).map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span className="text-muted-foreground">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )}
              </div>

              <div className="lg:sticky lg:top-24 mt-8 lg:mt-0">
                {generatedResume ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <ResumePreview
                      resumeData={generatedResume}
                      showTemplateSelector={false}
                      showCard={true}
                      headerActions={
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          onClick={handleSaveResume}
                          disabled={isSavingResume}
                        >
                          {isSavingResume ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                          Save to Library
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <Card className="aspect-[3/4] flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/20">
                    <div className="w-16 h-16 rounded-full bg-background shadow-sm border flex items-center justify-center mb-6">
                      <FileText className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Preview Your New Resume</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Your AI-tailored resume will appear here in real-time as it&apos;s generated.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Cover Letter Tab */}
          <TabsContent value="cover-letter" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Send className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Letter Specifications</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium block mb-2">Job Description</label>
                      <Textarea
                        value={coverLetterJobDescription}
                        onChange={(e) => setCoverLetterJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={10}
                        className="font-mono text-xs resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">Personal Touch (Tone, Instructions)</label>
                      <Textarea
                        value={coverLetterPersonalInstructions}
                        onChange={(e) => setCoverLetterPersonalInstructions(e.target.value)}
                        placeholder="e.g. Highlight my leadership experience. Use an energetic but professional tone."
                        rows={3}
                        className="text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Profile Data</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={selectedCoverLetterProfileId}
                          onChange={(e) => setSelectedCoverLetterProfileId(e.target.value)}
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">AI Model</label>
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

                    <div className="flex gap-3 pt-2">
                      <Button 
                        className="flex-1 shadow-sm" 
                        size="lg"
                        disabled={isGeneratingCoverLetter || coverLetterJobDescription.length < 50 || !hasAIProviders}
                        onClick={handleGenerateCoverLetter}
                      >
                        {isGeneratingCoverLetter ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Drafting Letter...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Cover Letter
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="lg" onClick={resetCoverLetter} className="px-6">Reset</Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:sticky lg:top-24 mt-8 lg:mt-0">
                {generatedCoverLetter ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <CoverLetterEditor
                      content={generatedCoverLetter}
                      editable={true}
                      onSave={async (content) => {
                        log.debug('Saving generated cover letter', { contentLength: content.length });
                      }}
                    />
                  </div>
                ) : (
                  <Card className="aspect-[3/4] flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/20">
                    <div className="w-16 h-16 rounded-full bg-background shadow-sm border flex items-center justify-center mb-6">
                      <Send className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Preview Cover Letter</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Your personalized cover letter will be ready for review here once generated.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Cover Letter Tab */}
          <TabsContent value="cover-letter" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Send className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Letter Specifications</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium block mb-2">Job Description</label>
                      <Textarea
                        value={coverLetterJobDescription}
                        onChange={(e) => setCoverLetterJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={10}
                        className="font-mono text-xs resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">Personal Touch (Tone, Instructions)</label>
                      <Textarea
                        value={coverLetterPersonalInstructions}
                        onChange={(e) => setCoverLetterPersonalInstructions(e.target.value)}
                        placeholder="e.g. Highlight my leadership experience. Use an energetic but professional tone."
                        rows={3}
                        className="text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Profile Data</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={selectedCoverLetterProfileId}
                          onChange={(e) => setSelectedCoverLetterProfileId(e.target.value)}
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">AI Model</label>
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

                    <div className="flex gap-3 pt-2">
                      <Button 
                        className="flex-1 shadow-sm" 
                        size="lg"
                        disabled={isGeneratingCoverLetter || coverLetterJobDescription.length < 50 || !hasAIProviders}
                        onClick={handleGenerateCoverLetter}
                      >
                        {isGeneratingCoverLetter ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Drafting Letter...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Cover Letter
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="lg" onClick={resetCoverLetter} className="px-6">Reset</Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:sticky lg:top-24">
                {generatedCoverLetter ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <CoverLetterEditor
                      content={generatedCoverLetter}
                      editable={true}
                      onSave={async (content) => {
                        log.debug('Saving generated cover letter', { contentLength: content.length });
                      }}
                    />
                  </div>
                ) : (
                  <Card className="aspect-[3/4] flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/20">
                    <div className="w-16 h-16 rounded-full bg-background shadow-sm border flex items-center justify-center mb-6">
                      <Send className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Preview Cover Letter</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Your personalized cover letter will be ready for review here once generated.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Page>
  );
}
