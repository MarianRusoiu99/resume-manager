'use client';

import { useState, useEffect } from 'react';

interface FormData {
  name: string;
  description: string;
  htmlTemplate: string;
  isPublic: boolean;
}

export function useTemplatePersistence(isNew: boolean, initialData: FormData) {
  const [formData, setFormData] = useState<FormData>(initialData);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!isNew) return;
    const draftKey = 'template-editor-draft';
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
      } catch {
        // Ignore invalid draft
      }
    }
  }, [isNew]);

  useEffect(() => {
    if (!isNew) return;
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
