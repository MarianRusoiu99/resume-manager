'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Resume } from '@/lib/validations/jsonresume';
import { logger } from '@/lib/utils/logger';

/**
 * Hook options
 */
export interface UseEditorPersistenceOptions {
  initialResume?: Resume;
  onLoad?: () => Promise<Resume | null>;
  onSave: (resume: Resume) => Promise<boolean>;
  autoLoad?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

/**
 * Logic-only hook for editor state and persistence
 */
export function useEditorPersistence({
  initialResume,
  onLoad,
  onSave,
  autoLoad = true,
  autoSave = false,
  autoSaveDelay = 2000
}: UseEditorPersistenceOptions) {
  const [resume, setResume] = useState<Resume>(initialResume || getEmptyResume());
  const [loading, setLoading] = useState(autoLoad && !!onLoad);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load data using onLoad callback
   */
  const loadData = useCallback(async () => {
    if (!onLoad) return;

    try {
      setLoading(true);
      const data = await onLoad();
      if (data) {
        setResume(data);
        setIsDirty(false);
      } else {
        setResume(getEmptyResume());
      }
    } catch (error) {
      logger.error('Error loading editor data', error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [onLoad]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && onLoad) {
      loadData();
    }
  }, [autoLoad, onLoad, loadData]);

  /**
   * Save resume
   */
  const save = useCallback(async (): Promise<boolean> => {
    if (isSaving) return false;
    
    setIsSaving(true);
    try {
      const success = await onSave(resume);
      if (success) {
        setIsDirty(false);
        setLastSavedAt(new Date());
        toast.success("Changes saved successfully!", {
          id: 'editor-save-success',
        });
      } else {
        toast.error("Failed to save changes");
      }
      return success;
    } catch (error) {
      logger.error('Error saving editor data', error);
      toast.error("Failed to save changes");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [resume, onSave, isSaving]);

  /**
   * Auto-save effect
   */
  useEffect(() => {
    if (!autoSave || !isDirty || isSaving) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const success = await onSave(resume);
        if (success) {
          setIsDirty(false);
          setLastSavedAt(new Date());
        } else {
          toast.error('Failed to auto-save changes');
        }
      } catch (error) {
        logger.error('Auto-save failed', error);
        toast.error('Failed to auto-save changes');
      } finally {
        setIsSaving(false);
      }
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [resume, isDirty, autoSave, autoSaveDelay, onSave, isSaving]);

  const updateResume = useCallback((newResume: Resume) => {
    setResume(newResume);
    setIsDirty(true);
  }, []);

  const updateField = useCallback(<K extends keyof Resume>(field: K, value: Resume[K]) => {
    setResume(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  return {
    resume,
    loading,
    isSaving,
    lastSavedAt,
    isDirty,
    setIsDirty,
    updateResume,
    updateField,
    save,
    reload: loadData,
  };
}

/**
 * Create an empty resume
 */
function getEmptyResume(): Resume {
  return {
    basics: {
      name: "",
      email: "",
      phone: "",
      summary: "",
      location: { city: "", countryCode: "" },
      profiles: [],
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
    certificates: [],
    languages: [],
    volunteer: [],
    awards: [],
    publications: [],
    interests: [],
    references: [],
  };
}
