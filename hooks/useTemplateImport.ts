'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useTemplateGeneration } from '@/components/ai-enhance/hooks/useTemplateEnhancement';
import type { ExtractedTemplate } from '@/lib/ai/template-parser';

interface UseTemplateImportOptions {
  onImportComplete: (template: ExtractedTemplate) => void;
  onClose: () => void;
}

export function useTemplateImport({ onImportComplete, onClose }: UseTemplateImportOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { generate, template, isLoading, error, reset } = useTemplateGeneration();

  // Clear interval helper
  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Handle completion
  useEffect(() => {
    if (template) {
      setLoadingStep('Template extracted!');
      setProgress(100);
      clearProgressInterval();
      
      toast.success('Template extracted successfully!');
      
      const timer = setTimeout(() => {
        onImportComplete(template);
        resetStates();
        onClose();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [template, onImportComplete, clearProgressInterval, onClose]);

  // Handle errors
  useEffect(() => {
    if (error) {
      clearProgressInterval();
      setProgress(0);
      setLoadingStep('');
    }
  }, [error, clearProgressInterval]);

  const resetStates = useCallback(() => {
    reset();
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    setLoadingStep('');
    clearProgressInterval();
  }, [reset, clearProgressInterval]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setPreview('pdf-placeholder');
    }
  }, []);

  const handleImport = async () => {
    if (!selectedFile) return;

    setProgress(10);
    setLoadingStep('Uploading image...');
    
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        
        if (prev > 20 && prev <= 50) setLoadingStep('AI is analyzing layout...');
        if (prev > 50 && prev <= 80) setLoadingStep('Extracting CSS styles...');
        if (prev > 80) setLoadingStep('Finalizing template...');
        
        return prev + 5;
      });
    }, 1200);

    await generate(selectedFile);
  };

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
  }, []);

  return {
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
  };
}
