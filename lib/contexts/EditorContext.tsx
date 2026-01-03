"use client";

import React, { createContext, useContext, useMemo, ReactNode } from "react";
import type { Resume } from "@/lib/validations/jsonresume";
import { useEditorPersistence } from "@/hooks/editor/useEditorPersistence";

/**
 * Unified Editor Context Interface
 */
export interface EditorContextType {
  resume: Resume;
  loading: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  updateResume: (resume: Resume) => void;
  updateField: <K extends keyof Resume>(field: K, value: Resume[K]) => void;
  save: () => Promise<boolean>;
  reload: () => Promise<void>;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
}

interface EditorProviderProps {
  readonly children: ReactNode;
  readonly initialResume?: Resume;
  readonly onLoad?: () => Promise<Resume | null>;
  readonly onSave: (resume: Resume) => Promise<boolean>;
  readonly autoLoad?: boolean;
  readonly autoSave?: boolean;
  readonly autoSaveDelay?: number;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

/**
 * Unified Editor Provider
 */
export function EditorProvider({
  children,
  initialResume,
  onLoad,
  onSave,
  autoLoad = true,
  autoSave = false,
  autoSaveDelay = 2000
}: EditorProviderProps) {
  const persistence = useEditorPersistence({
    initialResume,
    onLoad,
    onSave,
    autoLoad,
    autoSave,
    autoSaveDelay
  });

  const contextValue = useMemo(
    () => ({
      resume: persistence.resume,
      loading: persistence.loading,
      isSaving: persistence.isSaving,
      lastSavedAt: persistence.lastSavedAt,
      updateResume: persistence.updateResume,
      updateField: persistence.updateField,
      save: persistence.save,
      reload: persistence.reload,
      isDirty: persistence.isDirty,
      setDirty: persistence.setIsDirty,
    }),
    [
      persistence.resume,
      persistence.loading,
      persistence.isSaving,
      persistence.lastSavedAt,
      persistence.updateResume,
      persistence.updateField,
      persistence.save,
      persistence.reload,
      persistence.isDirty,
      persistence.setIsDirty,
    ]
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

/**
 * Hook to access editor context
 */
export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
