'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { importResume } from '@/app/actions/resume';
import { resumeSchema } from '@/lib/validations/jsonresume';
import type { Resume } from '@/lib/validations/jsonresume';
import { createComponentLogger } from '@/lib/utils/client-logger';

const log = createComponentLogger('useResumeImport');

interface UseResumeImportOptions {
  onImportComplete: (resume: Resume) => void;
  onClose: () => void;
}

export function useResumeImport({ onImportComplete, onClose }: UseResumeImportOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedResume, setImportedResume] = useState<Resume | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const resetStates = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    setLoadingStep('');
    setIsLoading(false);
    setError(null);
    setImportedResume(null);
    clearProgressInterval();
  }, [clearProgressInterval]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setPreview('pdf-placeholder');
    } else {
      setPreview('doc-placeholder');
    }
  }, []);

  const handleImport = async (modelId?: string) => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setProgress(10);
    setLoadingStep('Uploading document...');
    
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        
        if (prev > 15 && prev <= 40) setLoadingStep('AI is analyzing document structure...');
        if (prev > 40 && prev <= 70) setLoadingStep('Extracting contact info and experience...');
        if (prev > 70) setLoadingStep('Formatting resume data...');
        
        return prev + 5;
      });
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (modelId) {
        formData.append('modelId', modelId);
      }

      const result = await importResume(formData);


      if (!result.success) {
        throw new Error(result.error ?? 'Failed to import resume');
      }

      if (!result.data?.resume) {
        throw new Error('No resume data returned');
      }

      // Validate the extracted resume data
      const validation = resumeSchema.safeParse(result.data.resume);
      if (!validation.success) {
        log.error('Validation errors', undefined, { issues: validation.error.issues });
        throw new Error("Extracted data doesn't match resume schema. Please try again with a different document.");
      }

      setProgress(100);
      setLoadingStep('Import complete!');
      setImportedResume(validation.data);
      
      toast.success('Resume imported successfully!');
      
      setTimeout(() => {
        onImportComplete(validation.data);
        resetStates();
        onClose();
      }, 1000);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import resume';
      setError(message);
      toast.error(message);
      clearProgressInterval();
    } finally {
      setIsLoading(false);
      clearProgressInterval();
    }
  };

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  }, []);

  return {
    selectedFile,
    preview,
    progress,
    loadingStep,
    isLoading,
    error,
    importedResume,
    handleFileSelect,
    handleImport,
    handleRemoveFile,
    resetStates,
  };
}
