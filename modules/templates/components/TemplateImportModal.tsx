'use client';

/**
 * Refactored Template Import Modal Component
 * Uses the new useTemplateGeneration hook for AI extraction.
 */

import React, { useCallback } from 'react';
import NextImage from 'next/image';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Image as ImageIcon, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useTemplateImport } from '../hooks/useTemplateImport';
import type { ExtractedTemplate } from '@/lib/ai/template-parser';
import type { Resume } from '@/lib/validations/jsonresume';
import { ModelSelector } from '@/components/ai/ModelSelector';
import { ResumePreview } from '@/modules/resume/components/ResumePreview';
import { sampleResume } from '@/lib/templates/constants/sample-resume';
import { useFeatureModelPreference } from "@/hooks";

interface TemplateImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (template: ExtractedTemplate) => void;
}

export function TemplateImportModal({
  open,
  onOpenChange,
  onImportComplete,
}: Readonly<TemplateImportModalProps>) {
  const { modelId, updatePreference, isLoading: isPreferencesLoading } = useFeatureModelPreference('template');

  const handleModelChange = React.useCallback((newModelId: string, newProviderId: string) => {
    updatePreference(newModelId, newProviderId);
  }, [updatePreference]);

  const {
    selectedFile,
    preview,
    progress,
    loadingStep,
    isLoading,
    error,
    template,
    handleFileSelect,
    handleImport,
    handleRemoveFile,
    resetStates,
  } = useTemplateImport({
    onImportComplete,
    onClose: () => onOpenChange(false),
  });

  const handleClose = useCallback(() => {
    // If not loading, we can reset everything. 
    // If it IS loading, we just close the modal but let the background process continue 
    // (the user requested to be able to leave and receive a notification)
    if (!isLoading) {
      resetStates();
    }
    onOpenChange(false);
  }, [isLoading, onOpenChange, resetStates]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  const onExtract = useCallback(() => {
    handleImport(modelId);
  }, [handleImport, modelId]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Import Template
          </DialogTitle>
          <DialogDescription>
            Upload a screenshot, image, or PDF of a resume template. Our AI will analyze
            the layout and generate a matching Handlebars template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          {!preview && !isLoading && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the file here...'
                  : 'Drag & drop a template file, or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPEG, WebP, GIF or PDF up to 10MB
              </p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border bg-muted/20 min-h-[12rem] flex items-center justify-center">
                {preview === 'pdf-placeholder' ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-12 w-12" />
                    <p className="text-sm font-medium">PDF Document Selected</p>
                  </div>
                ) : (
                  <NextImage
                    src={preview}
                    alt="Template preview"
                    width={800}
                    height={192}
                    className="w-full h-48 object-contain"
                    unoptimized
                  />
                )}
                {!isLoading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                    title="Clear selected file"
                  >
                    <AlertCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              {selectedFile && !isLoading && (
                <p className="text-sm text-muted-foreground text-center">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}

          {/* Progress */}
          {isLoading && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 h-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingStep || 'AI is analyzing the template...'}
                </div>
                <p className="text-[10px] text-muted-foreground/60 animate-pulse">
                  This multi-step process can take up to 60 seconds...
                </p>
              </div>
            </div>
          )}

          {/* Success */}
          {template && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-5 w-5" />
                Template extracted and refined successfully!
              </div>

              <div className="border rounded-lg overflow-hidden bg-white shadow-sm h-[300px] relative">
                <div className="absolute inset-0 overflow-auto p-4 origin-top scale-[0.6] w-[166.6%] h-[166.6%]">
                  <ResumePreview
                    resumeData={sampleResume as Resume}
                    templateHtml={template.htmlTemplate}
                    showTemplateSelector={false}
                    showCard={false}
                    disableScaling={true}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center italic">
                Preview rendering with sample data
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-2">
            {!isLoading && selectedFile && !template && (
              <div className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/5 border-primary/10 shadow-sm transition-all hover:bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary/80">AI Model Settings</span>
                    <span className="text-[11px] text-muted-foreground">Select a vision-capable model for extraction</span>
                  </div>
                  <ModelSelector
                    requiresVision
                    requiresStructuredOutput
                    value={modelId}
                    onValueChange={handleModelChange}
                    isLoading={isPreferencesLoading}
                    className="w-[180px] h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {isLoading && (
                <p className="text-[11px] text-center text-muted-foreground bg-muted/30 py-2 rounded-md border border-dashed">
                  You can safely close this window. We'll notify you once your template is ready in the library.
                </p>
              )}
              
              <div className="flex justify-end gap-2">
                {!isLoading && (
                  <Button
                    variant="outline"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                )}
                
                {!isLoading && selectedFile && !template && (
                  <Button onClick={onExtract}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Extract Template
                  </Button>
                )}
                
                {error && !isLoading && (
                  <Button onClick={onExtract}>
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
