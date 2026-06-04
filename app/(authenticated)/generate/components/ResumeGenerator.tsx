import { useState } from 'react';
import { Sparkles, FileSearch, Trash2, AlertTriangle } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { BaseDialog } from '@/components/core/feedback/dialogs/BaseDialog';
import { Callout } from '@/components/core/feedback/Callout';
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
    modelId,
    isModelLoading,
    handleModelChange,
    generatedResume,
    isGenerating,
    error,
    handleGenerate,
    handleDiscard,
    savedId,
  } = useResumeFlow(defaultProfileId);

  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);

  const onGenerateClick = async () => {
    const result = await handleGenerate();
    if (result === 'confirm_overwrite') {
      setShowConfirmOverwrite(true);
    }
  };

  const onConfirmOverwrite = async () => {
    setShowConfirmOverwrite(false);
    await handleGenerate(true);
  };

  return (
    <>
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
              onGenerate={onGenerateClick}
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
        </Card>

      <div className="bg-card rounded-2xl overflow-hidden shadow-sm flex flex-col h-[800px] min-h-[600px] border-none">
        {generatedResume ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preview</span>
              {savedId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDiscard}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-[10px] font-bold uppercase tracking-widest px-3"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Discard Draft
                </Button>
              )}
            </div>
            <ResumePreview
              resumeData={generatedResume}
              showCard={false}
              className="w-full flex-1"
              disableScaling={false}
            />
          </div>
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

      <BaseDialog
        open={showConfirmOverwrite}
        onOpenChange={setShowConfirmOverwrite}
        title="Replace Existing Draft?"
        description="You already have a saved version of this resume. Starting a new generation will replace it."
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 rounded-xl font-bold uppercase tracking-widest"
              onClick={() => setShowConfirmOverwrite(false)}
            >
              Keep Current
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl font-bold uppercase tracking-widest"
              onClick={onConfirmOverwrite}
            >
              Replace
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to discard your current draft and start over? This action cannot be undone.
          </p>
        </div>
      </BaseDialog>
    </>
  );
}
