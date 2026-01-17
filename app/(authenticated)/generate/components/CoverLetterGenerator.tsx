'use client';

import { useState } from 'react';
import { Send, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { BaseDialog } from '@/components/core/feedback/dialogs/BaseDialog';
import { Callout } from '@/components/core/feedback/Callout';
import { Spinner } from '@/components/core/feedback/Spinner';
import { CoverLetterEditor } from '@/modules/cover-letter/components/CoverLetterEditor';
import { ProfileListItem } from '@/lib/actions/types';
import { useCoverLetterFlow } from './useCoverLetterFlow';
import { CoverLetterInput } from './CoverLetterInput';
import { GenerationSettings } from './GenerationSettings';

interface CoverLetterGeneratorProps {
  profiles: ProfileListItem[];
  hasAIProviders: boolean;
  defaultProfileId: string;
}

export function CoverLetterGenerator({
  profiles,
  hasAIProviders,
  defaultProfileId,
}: CoverLetterGeneratorProps) {
  const {
    selectedProfileId,
    setSelectedProfileId,
    jobDescription,
    setJobDescription,
    personalInstructions,
    setPersonalInstructions,
    isSaving,
    modelId,
    isModelLoading,
    handleModelChange,
    generatedCoverLetter,
    isGenerating,
    error,
    reset,
    handleGenerate,
    handleDiscard,
    handleSave,
    savedId,
  } = useCoverLetterFlow(defaultProfileId);

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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Letter Specifications</h3>
          </div>

          <div className="space-y-6">
            <CoverLetterInput
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              personalInstructions={personalInstructions}
              onPersonalInstructionsChange={setPersonalInstructions}
              isLoading={isGenerating}
              isDisabled={isGenerating || jobDescription.length < 50 || !hasAIProviders || !modelId}
              onGenerate={onGenerateClick}
            />

          <GenerationSettings
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onProfileChange={setSelectedProfileId}
            modelId={modelId}
            onModelChange={handleModelChange}
            isModelLoading={isModelLoading}
          />

          {error && <Callout variant="danger" className="rounded-xl border-none">{error}</Callout>}
        </div>
      </Card>

      <div className="bg-card rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[600px] border-none relative h-[800px]">
        {generatedCoverLetter ? (
          <div className="h-full flex flex-col relative">
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
            <div className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8">
              <div className="max-w-4xl mx-auto h-full shadow-2xl rounded-xl overflow-hidden border-none bg-background animate-in fade-in zoom-in-95 duration-500">
                <CoverLetterEditor
                  content={generatedCoverLetter}
                  editable={true}
                  onSave={handleSave}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-background/80 backdrop-blur rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Send className="w-10 h-10 text-primary/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Craft a Winner</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Your personalized cover letter will be ready for review here once you initiate the process.
            </p>
          </div>
        )}
      </div>
      </div>

      <BaseDialog
        open={showConfirmOverwrite}
        onOpenChange={setShowConfirmOverwrite}
        title="Replace Existing Draft?"
        description="You already have a saved version of this cover letter. Starting a new generation will replace it."
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
