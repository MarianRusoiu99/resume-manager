'use client';

import { useState, useEffect, useRef } from 'react';

interface FormData {
  name: string;
  description: string;
  htmlTemplate: string;
  isPublic: boolean;
}

export function useTemplatePersistence(isNew: boolean, initialData: FormData) {
  // Initialize state with draft from localStorage if available
  const getInitialData = (): FormData => {
    if (!isNew) return initialData;
    
    if (typeof window === 'undefined') return initialData;
    
    const draftKey = 'template-editor-draft';
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        return JSON.parse(draft);
      } catch {
        // Ignore invalid draft
      }
    }
    return initialData;
  };

  const [formData, setFormData] = useState<FormData>(getInitialData);
  const isInitialized = useRef(false);

  // Save draft to localStorage on changes (but not on initial load)
  useEffect(() => {
    if (!isNew) return;
    
    // Skip the first render
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    
    const draftKey = 'template-editor-draft';
    localStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData, isNew]);

  const clearDraft = () => {
    localStorage.removeItem('template-editor-draft');
  };

  return {
    formData,
    setFormData,
    clearDraft,
  };
}
