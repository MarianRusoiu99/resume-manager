'use client';

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
import { Upload, FileText, Loader2, AlertCircle, Settings2 } from 'lucide-react';
import { useResumeImport } from '@/hooks';
import type { Resume } from '@/lib/validations/jsonresume';
import { ModelSelector } from '@/components/ai/ModelSelector';
import { useFeatureModelPreference } from '@/hooks';;

interface ResumeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (resume: Resume) => void;
}

export function ResumeImportModal({
  open,
  onOpenChange,
  onImportComplete,
}: Readonly<ResumeImportModalProps>) {
  const { modelId, updatePreference } = useFeatureModelPreference('resume');

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
    handleFileSelect,
    handleImport,
    handleRemoveFile,
    resetStates,
  } = useResumeImport({
    onImportComplete,
    onClose: () => onOpenChange(false),
  });

  const handleClose = useCallback(() => {
    if (!isLoading) {
      resetStates();
      onOpenChange(false);
    }
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
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Import Resume
          </DialogTitle>
          <DialogDescription>
            Upload your existing resume (PDF, Word, or Image). Our AI will analyze
            the document and extract your information into your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          {!selectedFile && !isLoading && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-10 text-center cursor-pointer
                transition-all duration-200
                ${isDragActive
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {isDragActive
                      ? 'Drop the resume here...'
                      : 'Drag & drop your resume, or click to browse'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Word, Images, or Text up to 10MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview / File Info */}
          {selectedFile && !isLoading && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border bg-muted/20 min-h-[12rem] flex items-center justify-center p-4">
                {preview === 'pdf-placeholder' || preview === 'doc-placeholder' ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="p-4 bg-background rounded-xl shadow-sm border">
                        <FileText className="h-12 w-12 text-primary/60" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                        <p className="text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : preview ? (
                  <div className="relative w-full h-48">
                    <NextImage
                        src={preview}
                        alt="Resume preview"
                        fill
                        className="object-contain"
                        unoptimized
                    />
                  </div>
                ) : null}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm border"
                  title="Remove file"
                >
                  <AlertCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Progress */}
          {isLoading && (
            <div className="space-y-4 py-4">
              <Progress value={progress} className="h-2" />
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  {loadingStep || 'Analyzing document...'}
                </div>
                <p className="text-xs text-muted-foreground max-w-[80%]">
                  Our AI is parsing your experience, skills, and education. This usually takes 15-30 seconds.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Import Failed</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Model Selection */}
          {!isLoading && selectedFile && !error && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">AI Intelligence</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Select a vision-capable model</span>
              </div>
              <ModelSelector 
                feature="resume"
                requiresVision
                value={modelId}
                onValueChange={handleModelChange}
                className="w-[180px]"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {selectedFile && !isLoading && !error && (
              <Button onClick={() => handleImport(modelId)} className="gap-2">
                <SparklesIcon className="h-4 w-4" />
                Start Extraction
              </Button>
            )}
            {error && (
               <Button onClick={() => handleImport(modelId)}>
                Try Again
              </Button>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
