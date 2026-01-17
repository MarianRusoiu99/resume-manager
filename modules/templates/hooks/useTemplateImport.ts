'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useTemplateGeneration } from '@/modules/ai-enhance/hooks/useTemplateEnhancement';

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

  const { generate, refine, template, isLoading, error, reset } = useTemplateGeneration();

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
      
      toast.success('Template extracted and refined successfully!');
      
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

  const handleImport = async (modelId?: string) => {
    if (!selectedFile) return;

    setManualProgress(10);
    setManualLoadingStep('Uploading image...');
    
    progressIntervalRef.current = setInterval(() => {
      setManualProgress((prev) => {
        if (prev >= 95) return 95;
        
        if (prev > 15 && prev <= 40) setManualLoadingStep('AI is analyzing layout...');
        if (prev > 40 && prev <= 60) setManualLoadingStep('Extracting CSS styles...');
        if (prev > 60 && prev <= 80) setManualLoadingStep('Generating initial template...');
        if (prev > 80) setManualLoadingStep('Refining with dummy data...');
        
        return prev + 5;
      });
    }, 1500);

    // Step 1: Generate initial template
    const initialResult = await generate(selectedFile, modelId);
    
    if (initialResult && typeof initialResult === 'object' && 'htmlTemplate' in initialResult) {
      setManualProgress(85);
      setManualLoadingStep('Refining with dummy data...');
      
      // Step 2: Refine template with dummy data
      await refine(selectedFile, (initialResult as { htmlTemplate: string }).htmlTemplate, modelId);
    }
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
