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
import { getResumes, generateResume, saveGeneratedResume } from '@/app/actions/resume';
import { getProfiles } from '@/app/actions/profile';
import { getApiProviders } from '@/app/actions/api-provider';
import { createCoverLetter } from '@/app/actions/cover-letter';
import { useComponentLogger } from '@/hooks';
import type { TemplateBase } from '@/lib/types/template';
import { useResumeGeneration, useCoverLetterGeneration } from '@/components/ai-enhance/hooks';

import { ModelSelector } from '@/components/shared/ModelSelector';
import type { ApiProvider, ProfileListItem } from '@/lib/actions/types';

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
    generate: generateResumeAction,
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
      const result = await saveGeneratedResume({
        resume: generatedResume,
        jobDescription: resumeJobDescription,
        // We could extract job title/company from the generated resume if available
        jobTitle: (generatedResume as any)?.basics?.label || 'Optimized Resume',
        companyName: '', // Could be parsed from JD or provided by AI
        metadata: {
          matchScore,
          suggestions,
        }
      });

      if (result.success) {
        toast.success('Resume saved to library');
      } else {
        toast.error(result.error || 'Failed to save resume');
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
        const [profilesResult, providersResult] = await Promise.all([
          getProfiles(),
          getApiProviders(),
        ]);

        if (profilesResult.success && profilesResult.data) {
          setProfiles(profilesResult.data as any);
          const defaultProfile = (profilesResult.data as any).find((p: any) => p.isDefault) || profilesResult.data[0];
          if (defaultProfile) {
            setSelectedResumeProfileId(defaultProfile.id);
            setSelectedCoverLetterProfileId(defaultProfile.id);
          }
        }

        if (providersResult.success && providersResult.data) {
          setProviders(providersResult.data as any);
          const activeProviders = (providersResult.data as any).filter((p: any) => p.isActive);
          setHasAIProviders(activeProviders.length > 0);

          if (activeProviders.length > 0) {
            const firstModelId = activeProviders[0].models?.[0]?.id || '';
            setSelectedResumeModelId(firstModelId);
            setSelectedCoverLetterModelId(firstModelId);
          }
        }

        // Templates still need a server action or we can keep it as is if it's not core legacy
        // For now, let's just use empty templates or mock
        setTemplates([]);
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

    await generateResumeAction({
      jobDescription: resumeJobDescription,
      personalInstructions: '',
      overrideModelId: selectedResumeModelId,
    });
  }, [generateResumeAction, resumeJobDescription, selectedResumeModelId]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (coverLetterJobDescription.length < 50) {
      toast.error('Job description must be at least 50 characters');
      return;
    }

    await generateCoverLetter({
      jobDescription: coverLetterJobDescription,
      personalInstructions: coverLetterPersonalInstructions,
      overrideModelId: selectedCoverLetterModelId,
    });
  }, [generateCoverLetter, coverLetterJobDescription, coverLetterPersonalInstructions, selectedCoverLetterModelId]);

  const activeProviders = providers.filter(p => p.isActive);

  return (
    <Page
      title="Generate Content"
      description="Create tailored resumes and cover letters with AI"
      breadcrumbs={[{ label: 'Generate' }]}
    >
      <Tabs defaultValue={tabParam === 'cover-letter' ? 'cover-letter' : 'resume'} className="w-full">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="hidden sm:block">
            {tabParam === 'cover-letter' ? (
              <ModelSelector value={selectedCoverLetterModelId} onValueChange={setSelectedCoverLetterModelId} align="start" />
            ) : (
              <ModelSelector value={selectedResumeModelId} onValueChange={setSelectedResumeModelId} align="start" />
            )}
          </div>
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="resume" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="cover-letter" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Send className="w-4 h-4" />
              Cover Letter
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-2">
          {/* Resume Tab */}
          <TabsContent value="resume" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 space-y-8 rounded-2xl shadow-sm border-none bg-card/60 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Target Job Details</h3>
                  </div>
                  <div className="sm:hidden">
                    <ModelSelector value={selectedResumeModelId} onValueChange={setSelectedResumeModelId} />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5 ml-1">Job Description</label>
                    <Textarea
                      value={resumeJobDescription}
                      onChange={(e) => setResumeJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      rows={12}
                      className="font-mono text-xs resize-none rounded-xl bg-background/50 border-primary/5 focus-visible:ring-primary/20 transition-all p-4"
                    />
                    <div className="flex justify-between items-center mt-2 px-1">
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {resumeJobDescription.length}/50 min characters
                      </p>
                      {resumeJobDescription.length >= 50 && (
                        <span className="text-[9px] uppercase tracking-widest bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold">Ready</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Profile Source</label>
                      <select
                        className="w-full h-10 px-4 rounded-xl border border-primary/5 bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                        value={selectedResumeProfileId}
                        onChange={(e) => setSelectedResumeProfileId(e.target.value)}
                      >
                        {profiles.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Layout Template</label>
                      <select
                        className="w-full h-10 px-4 rounded-xl border border-primary/5 bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                      >
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">AI Model Preference</label>
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
                      className="rounded-xl border-primary/5 bg-background/50"
                    />
                  </div>

                  {!hasAIProviders && !isLoadingMetadata && (
                    <Callout variant="warning" className="rounded-xl border-none bg-amber-500/10 text-amber-700">
                      No AI providers configured. Go to <Link href={ROUTES.SETTINGS_API_KEYS} className="underline font-bold">Settings</Link> to add your API keys.
                    </Callout>
                  )}

                  {resumeError && (
                    <Callout variant="danger" className="rounded-xl border-none">
                      {resumeError}
                    </Callout>
                  )}

                  <Button
                    className="w-full rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold uppercase tracking-widest h-12"
                    size="lg"
                    disabled={isGeneratingResume || resumeJobDescription.length < 50 || !hasAIProviders}
                    onClick={handleGenerateResume}
                  >
                    {isGeneratingResume ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Tailoring...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Resume
                      </>
                    )}
                  </Button>
                </div>

                {matchScore !== null && (
                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Optimization Insights</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Match Score</span>
                        <span className="text-3xl font-black text-primary">{matchScore}%</span>
                      </div>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-primary/10">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-primary/70 mb-3 ml-1">Key Improvement Areas</p>
                        <ul className="text-xs space-y-2.5 ml-1">
                          {suggestions.slice(0, 3).map((s, i) => (
                            <li key={i} className="flex gap-2.5 items-start">
                              <span className="text-primary mt-1 font-bold">/</span>
                              <span className="text-muted-foreground leading-relaxed">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Card className="bg-muted/30 p-8 flex flex-col min-h-[600px] rounded-2xl border-none shadow-inner">
                {generatedResume ? (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 h-full">
                    <ResumePreview
                      resumeData={generatedResume}
                      showTemplateSelector={false}
                      showCard={false}
                      className="shadow-2xl rounded-xl overflow-hidden"
                      headerActions={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 rounded-lg font-bold uppercase tracking-widest text-[10px] bg-background border-primary/10 hover:bg-primary/5 hover:text-primary transition-all"
                          onClick={handleSaveResume}
                          disabled={isSavingResume}
                        >
                          {isSavingResume ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                          Save to Library
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                    <div className="w-20 h-20 bg-background/80 backdrop-blur rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-primary/5">
                      <FileText className="w-10 h-10 text-primary/30" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Ready to Transform?</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      Your AI-tailored resume will appear here in high fidelity once you start the generation.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Cover Letter Tab */}
          <TabsContent value="cover-letter" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 space-y-8 rounded-2xl shadow-sm border-none bg-card/60 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Send className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Letter Specifications</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5 ml-1">Job Description</label>
                    <Textarea
                      value={coverLetterJobDescription}
                      onChange={(e) => setCoverLetterJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      rows={12}
                      className="font-mono text-xs resize-none rounded-xl bg-background/50 border-primary/5 focus-visible:ring-primary/20 transition-all p-4"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5 ml-1">Personal Touch</label>
                    <Textarea
                      value={coverLetterPersonalInstructions}
                      onChange={(e) => setCoverLetterPersonalInstructions(e.target.value)}
                      placeholder="e.g. Highlight my leadership experience. Use an energetic but professional tone."
                      rows={4}
                      className="text-xs resize-none rounded-xl bg-background/50 border-primary/5 focus-visible:ring-primary/20 transition-all p-4"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Profile Data</label>
                      <select
                        className="w-full h-10 px-4 rounded-xl border border-primary/5 bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                        value={selectedCoverLetterProfileId}
                        onChange={(e) => setSelectedCoverLetterProfileId(e.target.value)}
                      >
                        {profiles.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">AI Model</label>
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
                        className="rounded-xl border-primary/5 bg-background/50"
                      />
                    </div>
                  </div>

                  {coverLetterError && (
                    <Callout variant="danger" className="rounded-xl border-none">
                      {coverLetterError}
                    </Callout>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      className="flex-1 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold uppercase tracking-widest h-12"
                      size="lg"
                      disabled={isGeneratingCoverLetter || coverLetterJobDescription.length < 50 || !hasAIProviders}
                      onClick={handleGenerateCoverLetter}
                    >
                      {isGeneratingCoverLetter ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Drafting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Letter
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="lg" onClick={resetCoverLetter} className="px-6 rounded-xl font-bold uppercase tracking-widest h-12 border-primary/10 hover:bg-primary/5 transition-all">Reset</Button>
                  </div>
                </div>
              </Card>

              <Card className="bg-muted/30 p-8 flex flex-col min-h-[600px] rounded-2xl border-none shadow-inner">
                {generatedCoverLetter ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300 h-full">
                    <CoverLetterEditor
                      content={generatedCoverLetter}
                      editable={true}
                      onSave={async (content) => {
                        log.debug('Saving generated cover letter', { contentLength: content.length });
                        const result = await createCoverLetter(
                          content,
                          coverLetterJobDescription,
                          '', // jobTitle
                          '', // companyName
                          {
                            personalInstructions: coverLetterPersonalInstructions,
                            jobDescription: coverLetterJobDescription,
                          }
                        );
                        if (result.success) {
                          toast.success('Cover letter saved to library');
                        } else {
                          toast.error(result.error || 'Failed to save cover letter');
                        }
                      }}
                      className="h-full shadow-2xl rounded-xl overflow-hidden border-none"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                    <div className="w-20 h-20 bg-background/80 backdrop-blur rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-primary/5">
                      <Send className="w-10 h-10 text-primary/30" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Craft a Winner</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      Your personalized cover letter will be ready for review here once you initiate the process.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Page>
  );
}
