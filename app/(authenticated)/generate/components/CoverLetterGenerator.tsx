'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Send, Save } from 'lucide-react';
import { Button, Card, Textarea } from '@/components/ui';
import { Callout, Spinner } from '@/components/shared';
import { ModelSelector } from '@/components/ai/ModelSelector';
import { CoverLetterEditor } from '@/components/cover-letter';
import { useCoverLetterGeneration } from '@/components/ai-enhance/hooks';
import { createCoverLetter } from '@/app/actions/cover-letter';
import type { ProfileListItem } from '@/lib/actions/types';

interface CoverLetterGeneratorProps {
  profiles: ProfileListItem[];
  hasAIProviders: boolean;
  defaultProfileId: string;
  defaultModelId: string;
}

export function CoverLetterGenerator({
  profiles,
  hasAIProviders,
  defaultProfileId,
  defaultModelId,
}: CoverLetterGeneratorProps) {
  // Initialize with defaults - use key pattern or controlled component for reset
  const [selectedProfileId, setSelectedProfileId] = useState(() => defaultProfileId);
  const [selectedModelId, setSelectedModelId] = useState(() => defaultModelId);
  const [jobDescription, setJobDescription] = useState('');
  const [personalInstructions, setPersonalInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
  }, []);

  const {
    generate,
    coverLetter: generatedCoverLetter,
    isLoading: isGenerating,
    error,
    reset,
  } = useCoverLetterGeneration();

  const handleGenerate = useCallback(async () => {
    if (jobDescription.length < 50) {
      toast.error('Job description must be at least 50 characters');
      return;
    }

    await generate({
      jobDescription,
      profileId: selectedProfileId,
      personalInstructions,
      overrideModelId: selectedModelId,
    });
  }, [generate, jobDescription, personalInstructions, selectedModelId, selectedProfileId]);

  const handleSave = async () => {
    if (!generatedCoverLetter) return;

    setIsSaving(true);
    try {
      const result = await createCoverLetter(
        generatedCoverLetter,
        jobDescription,
        '',
        '',
        {
          personalInstructions: personalInstructions,
          jobDescription: jobDescription,
        }
      );

      if (result.success) {
        toast.success('Cover letter saved to library');
      } else {
        toast.error(result.error || 'Failed to save cover letter');
      }
    } catch {
      toast.error('Failed to save cover letter');
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={12}
              className="font-mono text-xs resize-none rounded-xl bg-background/50 border-primary/5 focus-visible:ring-primary/20 transition-all p-4"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5 ml-1">Personal Touch</label>
            <Textarea
              value={personalInstructions}
              onChange={(e) => setPersonalInstructions(e.target.value)}
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
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">AI Model</label>
              <ModelSelector
                value={selectedModelId}
                onValueChange={handleModelChange}
                feature="coverLetter"
                requiresStructuredOutput={true}
                className="w-full"
              />
            </div>
          </div>

          {error && <Callout variant="danger" className="rounded-xl border-none">{error}</Callout>}

          <div className="flex gap-4 pt-4">
            <Button
              className="flex-1 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold uppercase tracking-widest h-12"
              size="lg"
              disabled={isGenerating || jobDescription.length < 50 || !hasAIProviders}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <><Spinner size="sm" className="mr-2" />Drafting...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate Letter</>
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={reset} className="px-6 rounded-xl font-bold uppercase tracking-widest h-12 border-primary/10 hover:bg-primary/5 transition-all">Reset</Button>
          </div>
        </div>
      </Card>

      <Card className="bg-muted/30 p-8 flex flex-col min-h-[600px] rounded-2xl border-none shadow-inner">
        {generatedCoverLetter ? (
          <div className="h-full flex flex-col shadow-2xl rounded-xl overflow-hidden border-none bg-background">
            <div className="flex justify-end border-b bg-muted/10 p-2">
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
            </div>
            <div className="flex-1 overflow-auto">
              <CoverLetterEditor
                content={generatedCoverLetter}
                editable={true}
                onSave={async (content) => {
                  const result = await createCoverLetter(
                    content,
                    jobDescription,
                    '',
                    '',
                    {
                      personalInstructions: personalInstructions,
                      jobDescription: jobDescription,
                    }
                  );
                  if (result.success) {
                    toast.success('Cover letter saved to library');
                  } else {
                    toast.error(result.error || 'Failed to save cover letter');
                  }
                }}
                className="h-full"
              />
            </div>
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
  );
}
