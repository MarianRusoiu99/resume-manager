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
  const [step, setStep] = useState<'welcome' | 'api-key'>('api-key');

  const handleApiKeySuccess = () => {
    onApiKeySuccess?.();
    setStep('welcome');
  };

  const handleSkipApiKey = () => {
    setStep('welcome');
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setStep('api-key');
    }}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6 pt-8">
          {step === 'api-key' ? (
            <>
              <DialogHeader className="mb-6">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
                  <Key className="h-6 w-6 text-amber-600" />
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  Welcome! Let&apos;s Setup AI
                </DialogTitle>
                <DialogDescription className="text-base">
                  Resume Optimizer uses advanced AI to help you build the perfect resume.
                  Provide your API key to enable premium AI features.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-card border rounded-xl p-6 mb-4">
                <ApiKeyForm
                  onSuccess={handleApiKeySuccess}
                  onCancel={handleSkipApiKey}
                  submitLabel="Save and Continue"
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-muted-foreground/10">
                  <Bell className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <strong>Notification Mode:</strong> You can skip this and add a key later in settings. Without a key, some AI features will be limited.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleSkipApiKey}
                >
                  Skip for now
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-primary/5">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  Create Your First Profile
                </DialogTitle>
                <DialogDescription className="text-base">
                  Your profile serves as the foundation for all resumes you&apos;ll create.
                  Import an existing one or start fresh.
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
                        Upload your PDF or Word resume. AI will extract your details automatically.
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
                        Create an empty profile and fill in your details manually.
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
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>AI-powered extraction supports PDF and DOCX</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
