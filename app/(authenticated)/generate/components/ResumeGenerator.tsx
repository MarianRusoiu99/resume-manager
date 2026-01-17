import { Sparkles, Save, FileSearch } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { Callout } from '@/components/core/feedback/Callout';
import { Spinner } from '@/components/core/feedback/Spinner';
import { EmptyState } from '@/components/core/feedback/states/EmptyState';
import { ResumePreview } from '@/modules/resume/components/ResumePreview';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { ProfileListItem } from '@/lib/actions/types';
import { useResumeFlow } from './useResumeFlow';
import { JobDescriptionInput } from './JobDescriptionInput';
import { GenerationSettings } from './GenerationSettings';

interface ResumeGeneratorProps {
  profiles: ProfileListItem[];
  hasAIProviders: boolean;
  isLoadingMetadata: boolean;
  defaultProfileId: string;
}

export function ResumeGenerator({
  profiles,
  hasAIProviders,
  isLoadingMetadata,
  defaultProfileId,
}: ResumeGeneratorProps) {
  const {
    selectedProfileId,
    setSelectedProfileId,
    jobDescription,
    setJobDescription,
    isSaving,
    modelId,
    isModelLoading,
    handleModelChange,
    generatedResume,
    isGenerating,
    error,
    matchScore,
    suggestions,
    handleGenerate,
    handleSave,
  } = useResumeFlow(defaultProfileId);

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
          <JobDescriptionInput
            value={jobDescription}
            onChange={setJobDescription}
            isLoading={isGenerating}
            isDisabled={isGenerating || jobDescription.length < 50 || !hasAIProviders || !modelId}
            onGenerate={handleGenerate}
            _hasAIProviders={hasAIProviders}
          />

          <GenerationSettings
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onProfileChange={setSelectedProfileId}
            modelId={modelId}
            onModelChange={handleModelChange}
            isModelLoading={isModelLoading}
          />

          {!hasAIProviders && !isLoadingMetadata && (
            <Callout variant="warning" className="rounded-xl border-none bg-amber-500/10 text-amber-700">
              No AI providers configured. Go to <Link href={ROUTES.SETTINGS_API_KEYS} className="underline font-bold">Settings</Link> to add your API keys.
            </Callout>
          )}

          {error && <Callout variant="danger" className="rounded-xl border-none">{error}</Callout>}
        </div>

        {matchScore !== null && (
          <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Match Score</span>
              <span className="text-3xl font-black text-primary">{matchScore}%</span>
            </div>
            {suggestions && suggestions.length > 0 && (
              <ul className="text-xs space-y-2.5 ml-1">
                {suggestions.slice(0, 3).map((s: string) => (
                  <li key={s} className="flex gap-2.5 items-start text-muted-foreground">
                    <span className="text-primary font-bold">/</span>{s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <div className="bg-card rounded-2xl overflow-hidden shadow-sm flex flex-col h-[800px] min-h-[600px] border-none">
        {generatedResume ? (
          <ResumePreview
            resumeData={generatedResume}
            showTemplateSelector={true}
            showCard={false}
            className="w-full h-full"
            disableScaling={false}
            headerActions={
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 rounded-lg font-bold uppercase tracking-widest text-[10px] bg-background border-primary/10 hover:bg-primary/5 hover:text-primary transition-all"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Spinner size="sm" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                Save to Library
              </Button>
            }
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <EmptyState
              icon={<FileSearch className="w-12 h-12 text-primary/20" />}
              title="Ready to Transform?"
              description="Your AI-tailored resume will appear here in high fidelity once you start the generation."
              withCard={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
