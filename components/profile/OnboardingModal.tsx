"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Rocket, Sparkles, Key, Bell } from "lucide-react";
import { ResumeImportButton } from "./ResumeImportButton";
import type { Resume } from "@/lib/validations/jsonresume";
import { ApiKeyForm } from "@/components/settings/ApiKeyForm";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartFromScratch: () => void;
  onImportSuccess: (resume: Resume) => void;
  onApiKeySuccess?: () => void;
}

export function OnboardingModal({
  open,
  onOpenChange,
  onStartFromScratch,
  onImportSuccess,
  onApiKeySuccess,
}: Readonly<OnboardingModalProps>) {
  const [step, setStep] = useState<'welcome' | 'api-key'>('welcome');

  const handleApiKeySuccess = () => {
    onApiKeySuccess?.();
    setStep('welcome');
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setStep('welcome');
    }}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6 pt-8">
          {step === 'welcome' ? (
            <>
              <DialogHeader className="mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-primary/5">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  Welcome to Resume Optimizer!
                </DialogTitle>
                <DialogDescription className="text-base">
                  To get started, let&apos;s create your first professional profile. This will be the base for all your optimized resumes.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4">
                {/* Import Option */}
                <div className="group relative border rounded-xl p-4 bg-card hover:border-primary/50 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Import Existing Resume</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload your current PDF, Word, or image resume. AI will extract your details automatically.
                      </p>
                      <ResumeImportButton onImportSuccess={onImportSuccess} />
                    </div>
                  </div>
                </div>

                {/* Scratch Option */}
                <div className="group relative border rounded-xl p-4 bg-card hover:border-primary/50 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 group-hover:bg-green-500/20 transition-colors">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Start from Scratch</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Prefer a fresh start? Create an empty profile and fill in your details manually.
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto"
                        onClick={onStartFromScratch}
                      >
                        Create Fresh Profile
                      </Button>
                    </div>
                  </div>
                </div>

                {/* API Key Option */}
                <div className="group relative border rounded-xl p-4 bg-card hover:border-primary/50 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                      <Key className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg font-medium">Configure AI (Optional)</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add your OpenAI or Anthropic API key now to enable all AI features immediately.
                      </p>
                      <Button 
                        variant="secondary" 
                        className="w-full sm:w-auto"
                        onClick={() => setStep('api-key')}
                      >
                        Setup API Key
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>AI-powered extraction supports PDF, DOCX, and Screenshots</span>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="mb-6">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
                  <Key className="h-6 w-6 text-amber-600" />
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  Setup Your API Key
                </DialogTitle>
                <DialogDescription className="text-base">
                  By providing your own API key, you only pay for what you use directly to the provider. 
                  If you skip this, you will receive notifications for AI-generated events.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-card border rounded-xl p-6 mb-4">
                <ApiKeyForm 
                  onSuccess={handleApiKeySuccess} 
                  onCancel={() => setStep('welcome')}
                  submitLabel="Save and Continue"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <Bell className="h-5 w-5 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700/80">
                  <strong>Notification Mode:</strong> Without an API key, you can still use the editor, and we will notify you when AI features are available or processed.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
