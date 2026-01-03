'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useTemplateGeneration } from '@/components/ai-enhance/hooks/useTemplateEnhancement';

interface UseTemplateImportOptions {
  onImportComplete: (template: { htmlTemplate: string; name?: string; description?: string }) => void;
  onClose: () => void;
}

export function useTemplateImport({ onImportComplete, onClose }: UseTemplateImportOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [manualProgress, setManualProgress] = useState(0);
  const [manualLoadingStep, setManualLoadingStep] = useState<string>('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { generate, template, isLoading, error, reset } = useTemplateGeneration();

  // Compute progress based on state - avoid setState in effects
  const progress = useMemo(() => {
    if (template) return 100;
    if (error) return 0;
    return manualProgress;
  }, [template, error, manualProgress]);

  const loadingStep = useMemo(() => {
    if (template) return 'Template extracted!';
    if (error) return '';
    return manualLoadingStep;
  }, [template, error, manualLoadingStep]);

  // Clear interval helper
  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Define resetStates BEFORE it's used in effects
  const resetStates = useCallback(() => {
    reset();
    setSelectedFile(null);
    setPreview(null);
    setManualProgress(0);
    setManualLoadingStep('');
    clearProgressInterval();
  }, [reset, clearProgressInterval]);

  // Handle completion
  useEffect(() => {
    if (template) {
      clearProgressInterval();
      
      toast.success('Template extracted successfully!');
      
      const timer = setTimeout(() => {
        // Convert string template to ExtractedTemplate structure
        const extractedTemplate = {
          htmlTemplate: template,
          name: selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'Imported Template',
        };
        onImportComplete(extractedTemplate);
        resetStates();
        onClose();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [template, onImportComplete, clearProgressInterval, onClose, resetStates, selectedFile]);

  // Handle errors - just clear the interval, state is computed
  useEffect(() => {
    if (error) {
      clearProgressInterval();
    }
  }, [error, clearProgressInterval]);

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

    setManualProgress(10);
    setManualLoadingStep('Uploading image...');
    
    progressIntervalRef.current = setInterval(() => {
      setManualProgress((prev) => {
        if (prev >= 90) return 90;
        
        if (prev > 20 && prev <= 50) setManualLoadingStep('AI is analyzing layout...');
        if (prev > 50 && prev <= 80) setManualLoadingStep('Extracting CSS styles...');
        if (prev > 80) setManualLoadingStep('Finalizing template...');
        
        return prev + 5;
      });
    }, 1200);

    await generate(selectedFile);
  };

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
  }, []);

  // Create extracted template object from raw template string
  const extractedTemplate = template ? {
    htmlTemplate: template,
    name: selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'Imported Template',
  } : null;

  return {
    selectedFile,
    preview,
    progress,
    loadingStep,
    isLoading,
    error,
    template: extractedTemplate,
    handleFileSelect,
    handleImport,
    handleRemoveFile,
    resetStates,
  };
}
