"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode, useRef } from "react";
import { toast } from "sonner";
import type { Resume } from "@/lib/validations/jsonresume";
import { logger } from "@/lib/utils/logger";

/**
 * Unified Editor Context Interface
 * 
 * This context is used for all editing scenarios:
 * - Profile editing (master resume)
 * - Individual resume editing (specific generated resume)
 */
export interface EditorContextType {
  /** Current resume data */
  resume: Resume;
  /** Loading state */
  loading: boolean;
  /** Saving state */
  isSaving: boolean;
  /** Last saved timestamp */
  lastSavedAt: Date | null;
  /** Update entire resume */
  updateResume: (resume: Resume) => void;
  /** Update a specific field in the resume */
  updateField: <K extends keyof Resume>(field: K, value: Resume[K]) => void;
  /** Save resume (calls onSave callback) */
  save: () => Promise<boolean>;
  /** Reload data (calls onLoad callback) */
  reload: () => Promise<void>;
  /** Has unsaved changes */
  isDirty: boolean;
  /** Set dirty state manually */
  setDirty: (dirty: boolean) => void;
}

interface EditorProviderProps {
  readonly children: ReactNode;
  /** Initial resume data (optional) */
  readonly initialResume?: Resume;
  /** Load data callback - called on mount */
  readonly onLoad?: () => Promise<Resume | null>;
  /** Save data callback - called when save() is invoked */
  readonly onSave: (resume: Resume) => Promise<boolean>;
  /** Auto-load on mount (default: true) */
  readonly autoLoad?: boolean;
  /** Auto-save on changes (default: true) */
  readonly autoSave?: boolean;
  /** Auto-save delay in milliseconds (default: 2000) */
  readonly autoSaveDelay?: number;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

/**
 * Unified Editor Provider
 * 
 * Single context for all editing scenarios with pluggable load/save callbacks
 * 
 * @example Profile editing
 * ```tsx
 * <EditorProvider
 *   onLoad={async () => {
 *     const res = await fetch('/api/profile');
 *     const data = await res.json();
 *     return data.resume;
 *   }}
 *   onSave={async (resume) => {
 *     await fetch('/api/profile', {
 *       method: 'PUT',
 *       body: JSON.stringify({ resume })
 *     });
 *     return true;
 *   }}
 * >
 *   <EditorUI />
 * </EditorProvider>
 * ```
 * 
 * @example Resume editing
 * ```tsx
 * <EditorProvider
 *   onLoad={async () => {
 *     const res = await fetch(`/api/resume/${id}`);
 *     const data = await res.json();
 *     return data.content;
 *   }}
 *   onSave={async (resume) => {
 *     await fetch(`/api/resume/${id}`, {
 *       method: 'PATCH',
 *       body: JSON.stringify({ resume })
 *     });
 *     return true;
 *   }}
 * >
 *   <EditorUI />
 * </EditorProvider>
 * ```
 */
export function EditorProvider({
  children,
  initialResume,
  onLoad,
  onSave,
  autoLoad = true,
  autoSave = false,  // Disabled by default - use manual save button
  autoSaveDelay = 2000
}: EditorProviderProps) {
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
        // No data found, use empty resume
        setResume(getEmptyResume());
      }
    } catch (error) {
      logger.error('Error loading editor data', error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [onLoad]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && onLoad) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /**
   * Auto-save when resume changes (debounced)
   */
  useEffect(() => {
    if (!autoSave || !isDirty || isSaving) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for autosave
    autoSaveTimeoutRef.current = setTimeout(async () => {
      logger.debug('Autosaving...');
      setIsSaving(true);
      try {
        const success = await onSave(resume);
        if (success) {
          setIsDirty(false);
          setLastSavedAt(new Date());
          logger.debug('Autosave successful');
          // Silent success - no toast for autosave to avoid interrupting user
        } else {
          logger.error('Autosave failed');
          toast.error('Failed to auto-save changes');
        }
      } catch (error) {
        logger.error('Autosave error', error);
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

  /**
   * Update entire resume
   */
  const updateResume = useCallback((newResume: Resume) => {
    setResume(newResume);
    setIsDirty(true);
  }, []);

  /**
   * Update a specific field in the resume
   */
  const updateField = useCallback(<K extends keyof Resume>(field: K, value: Resume[K]) => {
    setResume(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  /**
   * Save resume using onSave callback
   */
  const save = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const success = await onSave(resume);
      if (success) {
        setIsDirty(false);
        setLastSavedAt(new Date());
        toast.success("Changes saved successfully!");
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
  }, [resume, onSave]);

  /**
   * Reload data from source
   */
  const reload = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const contextValue = useMemo(
    () => ({
      resume,
      loading,
      isSaving,
      lastSavedAt,
      updateResume,
      updateField,
      save,
      reload,
      isDirty,
      setDirty: setIsDirty,
    }),
    [resume, loading, isSaving, lastSavedAt, updateResume, updateField, save, reload, isDirty]
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

/**
 * Hook to access editor context
 * @throws Error if used outside EditorProvider
 */
export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}

/**
 * Create an empty resume with all required fields
 */
function getEmptyResume(): Resume {
  return {
    basics: {
      name: "",
      email: "",
      phone: "",
      summary: "",
      location: {
        city: "",
        countryCode: "",
      },
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
