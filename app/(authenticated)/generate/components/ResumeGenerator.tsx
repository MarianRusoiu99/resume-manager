'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, FileText, Save } from 'lucide-react';
import { Button, Card, Textarea } from '@/components/ui';
import { Callout, Spinner } from '@/components/shared';
import { ModelSelector } from '@/components/ai/ModelSelector';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { useResumeGeneration } from '@/components/ai-enhance/hooks';
import { saveGeneratedResume } from '@/app/actions/resume';
import type { ProfileListItem } from '@/lib/actions/types';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface ResumeGeneratorProps {
  profiles: ProfileListItem[];
  hasAIProviders: boolean;
  isLoadingMetadata: boolean;
  defaultProfileId: string;
  defaultModelId: string;
}

export function ResumeGenerator({
  profiles,
  hasAIProviders,
  isLoadingMetadata,
  defaultProfileId,
  defaultModelId,
}: ResumeGeneratorProps) {
  const [selectedProfileId, setSelectedProfileId] = useState(() => defaultProfileId);
  const [selectedModelId, setSelectedModelId] = useState(() => defaultModelId);
  const [jobDescription, setJobDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleModelChange = useCallback((modelId: string, _providerId: string) => {
    setSelectedModelId(modelId);
  }, []);

  const {
    generate,
    resume: generatedResume,
    matchScore,
    suggestions,
    isLoading: isGenerating,
    error,
  } = useResumeGeneration();

  const handleGenerate = useCallback(async () => {
    if (jobDescription.length < 50) {
      toast.error('Job description must be at least 50 characters');
      return;
    }

    await generate({
      jobDescription,
      personalInstructions: '',
      overrideModelId: selectedModelId,
    });
  }, [generate, jobDescription, selectedModelId]);

  const handleSave = async () => {
    if (!generatedResume) return;

    setIsSaving(true);
    try {
      const resumeBasics = generatedResume as { basics?: { label?: string } };
      const result = await saveGeneratedResume({
        resume: generatedResume,
        jobDescription,
        jobTitle: resumeBasics?.basics?.label || 'Optimized Resume',
        companyName: '',
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
    } catch {
      toast.error('Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="p-8 space-y-8 rounded-2xl shadow-sm border-none bg-card/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Target Job Details</h3>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5 ml-1">Job Description</label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={12}
              className="font-mono text-xs resize-none rounded-xl bg-background/50 border-primary/5 focus-visible:ring-primary/20 transition-all p-4"
            />
            <div className="flex justify-between items-center mt-2 px-1">
              <p className="text-[10px] text-muted-foreground font-medium">
                {jobDescription.length}/50 min characters
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Profile Source</label>
              <select
                className="w-full h-10 px-4 rounded-xl border border-primary/5 bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">AI Model Preference</label>
              <ModelSelector
                value={selectedModelId}
                onValueChange={handleModelChange}
                className="w-full"
              />
            </div>
          </div>

          {!hasAIProviders && !isLoadingMetadata && (
            <Callout variant="warning" className="rounded-xl border-none bg-amber-500/10 text-amber-700">
              No AI providers configured. Go to <Link href={ROUTES.SETTINGS_API_KEYS} className="underline font-bold">Settings</Link> to add your API keys.
            </Callout>
          )}

          {error && <Callout variant="danger" className="rounded-xl border-none">{error}</Callout>}

          <Button
            className="w-full rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold uppercase tracking-widest h-12"
            size="lg"
            disabled={isGenerating || jobDescription.length < 50 || !hasAIProviders}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <><Spinner size="sm" className="mr-2" />Tailoring...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate Resume</>
            )}
          </Button>
        </div>

        {matchScore !== null && (
          <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Match Score</span>
              <span className="text-3xl font-black text-primary">{matchScore}%</span>
            </div>
            {suggestions.length > 0 && (
              <ul className="text-xs space-y-2.5 ml-1">
                {suggestions.slice(0, 3).map((s: string, i: number) => (
                  <li key={i} className="flex gap-2.5 items-start text-muted-foreground">
                    <span className="text-primary font-bold">/</span>{s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Card className="bg-muted/30 p-8 flex flex-col min-h-[600px] rounded-2xl border-none shadow-inner">
        {generatedResume ? (
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
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                Save to Library
              </Button>
            }
          />
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
  );
}
